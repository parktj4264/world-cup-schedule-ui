import { useMemo, useState, type RefObject } from 'react';
import type { Match } from '../data/schedule';
import {
  TOURNAMENT_DISCIPLINE,
  TOURNAMENT_STATISTICS_SOURCES,
  TOURNAMENT_TOP_ASSISTS,
  TOURNAMENT_TOP_CLEAN_SHEETS,
  TOURNAMENT_TOP_SCORERS,
  type TournamentPlayerStat,
} from '../data/tournamentStatistics';
import {
  calculateTournamentStatistics,
  type TeamTournamentStats,
} from '../utils/tournamentStats';
import { FlagIcon } from './FlagIcon';

type StatisticsTab = 'overview' | 'players' | 'teams';
type TeamSort = 'record' | 'goals' | 'clean-sheets';

type TournamentStatisticsDialogProps = {
  matches: Match[];
  dialogRef: RefObject<HTMLElement | null>;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

const TAB_LABELS: Array<{ id: StatisticsTab; label: string }> = [
  { id: 'overview', label: '한눈에' },
  { id: 'players', label: '선수' },
  { id: 'teams', label: '팀' },
];

const TEAM_SORT_LABELS: Array<{ id: TeamSort; label: string }> = [
  { id: 'record', label: '승리순' },
  { id: 'goals', label: '득점순' },
  { id: 'clean-sheets', label: '무실점순' },
];

const formatMatchRecord = (record: {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}) => `${record.home} ${record.homeScore}–${record.awayScore} ${record.away}`;

function PlayerLeaderboard({
  title,
  unit,
  entries,
}: {
  title: string;
  unit: string;
  entries: TournamentPlayerStat[];
}) {
  return (
    <section className="tournament-stat-leaderboard">
      <h3>{title}</h3>
      <ol>
        {entries.map((entry) => (
          <li key={`${title}-${entry.player}`}>
            <span className="tournament-stat-rank">{entry.rank}</span>
            <FlagIcon
              teamName={entry.team}
              fallback={entry.teamFlag}
              className="tournament-stat-player-flag"
            />
            <span className="tournament-stat-player-copy">
              <strong>{entry.player}</strong>
              <small>{entry.team}</small>
            </span>
            <strong className="tournament-stat-player-value">
              {entry.value}<small>{unit}</small>
            </strong>
          </li>
        ))}
      </ol>
    </section>
  );
}

const sortTeams = (teams: TeamTournamentStats[], sort: TeamSort) => [...teams].sort((left, right) => {
  if (sort === 'goals') {
    return right.goalsFor - left.goalsFor || right.wins - left.wins || right.goalDifference - left.goalDifference;
  }

  if (sort === 'clean-sheets') {
    return right.cleanSheets - left.cleanSheets || left.goalsAgainst - right.goalsAgainst || right.played - left.played;
  }

  return (
    right.wins - left.wins ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.team.localeCompare(right.team, 'ko')
  );
});

export function TournamentStatisticsDialog({
  matches,
  dialogRef,
  closeRef,
  onClose,
}: TournamentStatisticsDialogProps) {
  const [activeTab, setActiveTab] = useState<StatisticsTab>('overview');
  const [teamSort, setTeamSort] = useState<TeamSort>('record');
  const statistics = useMemo(() => calculateTournamentStatistics(matches), [matches]);
  const sortedTeams = useMemo(
    () => sortTeams(statistics.teams, teamSort),
    [statistics.teams, teamSort],
  );
  const topGoalCount = Math.max(0, ...statistics.teams.map((team) => team.goalsFor));
  const topWinCount = Math.max(0, ...statistics.teams.map((team) => team.wins));
  const topCleanSheetCount = Math.max(0, ...statistics.teams.map((team) => team.cleanSheets));
  const topAttacks = statistics.teams.filter((team) => team.goalsFor === topGoalCount);
  const topWinners = statistics.teams.filter((team) => team.wins === topWinCount);
  const topDefenses = statistics.teams.filter((team) => team.cleanSheets === topCleanSheetCount);
  const groupGoalShare = statistics.totalGoals > 0
    ? (statistics.groupGoals / statistics.totalGoals) * 100
    : 0;

  return (
    <div
      className="tournament-awards-overlay tournament-statistics-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-statistics-heading"
        className="tournament-awards-dialog tournament-statistics-dialog"
      >
        <header className="tournament-awards-header">
          <div>
            <div className="tournament-awards-eyebrow">2026 TOURNAMENT DATA</div>
            <h2 id="tournament-statistics-heading" className="tournament-awards-title">
              대회 통계
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="tournament-awards-close"
            onClick={onClose}
          >
            닫기
          </button>
        </header>

        <div className="tournament-stat-tabs" role="tablist" aria-label="대회 통계 분류">
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tournament-stat-panel-${tab.id}`}
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' ? (
          <div
            id="tournament-stat-panel-overview"
            className="tournament-stat-panel"
            role="tabpanel"
          >
            <div className="tournament-stat-hero-grid">
              <div><strong>{statistics.teamCount}</strong><span>참가국</span></div>
              <div><strong>{statistics.matchCount}</strong><span>전체 경기</span></div>
              <div><strong>{statistics.totalGoals}</strong><span>전체 득점</span></div>
              <div><strong>{statistics.goalsPerMatch.toFixed(2)}</strong><span>경기당 득점</span></div>
            </div>

            <div className="tournament-stat-mini-grid">
              <div><span>무승부</span><strong>{statistics.draws}경기</strong></div>
              <div><span>승부차기</span><strong>{statistics.shootouts}경기</strong></div>
              <div><span>무득점 무승부</span><strong>{statistics.goallessDraws}경기</strong></div>
              <div><span>팀 무실점 합계</span><strong>{statistics.cleanSheets}회</strong></div>
            </div>

            <section className="tournament-stat-section">
              <div className="tournament-stat-section-heading">
                <h3>스테이지별 득점</h3>
                <span>승부차기 득점 제외</span>
              </div>
              <div className="tournament-stat-goal-split" aria-label="조별리그와 토너먼트 득점 비율">
                <div
                  className="tournament-stat-goal-split-group"
                  style={{ width: `${groupGoalShare}%` }}
                />
                <div className="tournament-stat-goal-split-knockout" />
              </div>
              <div className="tournament-stat-goal-legend">
                <span><i className="group" />조별리그 <strong>{statistics.groupGoals}골</strong></span>
                <span><i className="knockout" />토너먼트 <strong>{statistics.knockoutGoals}골</strong></span>
              </div>
            </section>

            <section className="tournament-stat-section">
              <div className="tournament-stat-section-heading">
                <h3>대회 기록</h3>
                <span>최종 결과 기준</span>
              </div>
              <dl className="tournament-stat-records">
                <div>
                  <dt>최다 득점 경기</dt>
                  <dd>
                    {formatMatchRecord(statistics.highestScoringMatches[0])}
                    <small>{statistics.highestScoringMatches[0].totalGoals}골</small>
                  </dd>
                </div>
                <div>
                  <dt>최대 점수 차</dt>
                  <dd>
                    {statistics.biggestWins.map(formatMatchRecord).join(' · ')}
                    <small>{statistics.biggestWins[0].goalDifference}골 차</small>
                  </dd>
                </div>
                <div>
                  <dt>최다 득점 팀</dt>
                  <dd>
                    {topAttacks.map((team) => team.team).join(' · ')}
                    <small>{topGoalCount}골</small>
                  </dd>
                </div>
                <div>
                  <dt>최다 무실점 팀</dt>
                  <dd>
                    {topDefenses.map((team) => team.team).join(' · ')}
                    <small>{topCleanSheetCount}경기</small>
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}

        {activeTab === 'players' ? (
          <div
            id="tournament-stat-panel-players"
            className="tournament-stat-panel"
            role="tabpanel"
          >
            <div className="tournament-stat-player-grids">
              <PlayerLeaderboard title="득점" unit="골" entries={TOURNAMENT_TOP_SCORERS} />
              <PlayerLeaderboard title="도움" unit="개" entries={TOURNAMENT_TOP_ASSISTS} />
            </div>
            <div className="tournament-stat-player-secondary">
              <PlayerLeaderboard
                title="골키퍼 무실점"
                unit="경기"
                entries={TOURNAMENT_TOP_CLEAN_SHEETS}
              />
              <section className="tournament-stat-discipline">
                <h3>경고·퇴장</h3>
                <div className="tournament-stat-discipline-total">
                  <span className="tournament-stat-card-red" />
                  <strong>{TOURNAMENT_DISCIPLINE.totalRedCards}</strong>
                  <span>대회 전체 퇴장</span>
                </div>
                <div className="tournament-stat-yellow-leaders">
                  <span>최다 경고</span>
                  {TOURNAMENT_DISCIPLINE.yellowCardLeaders.map((entry) => (
                    <div key={entry.player}>
                      <span className="tournament-stat-card-yellow" />
                      <strong>{entry.player}</strong>
                      <small>{entry.team} · {entry.value}장</small>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {activeTab === 'teams' ? (
          <div
            id="tournament-stat-panel-teams"
            className="tournament-stat-panel"
            role="tabpanel"
          >
            <div className="tournament-stat-team-highlights">
              <div><span>최다 승리</span><strong>{topWinners.map((team) => team.team).join(' · ')}</strong><small>{topWinCount}승</small></div>
              <div><span>최다 득점</span><strong>{topAttacks.map((team) => team.team).join(' · ')}</strong><small>{topGoalCount}골</small></div>
              <div><span>최다 무실점</span><strong>{topDefenses.map((team) => team.team).join(' · ')}</strong><small>{topCleanSheetCount}경기</small></div>
            </div>
            <div className="tournament-stat-team-toolbar">
              <div>
                <strong>48개국 전체 기록</strong>
                <span>승부차기 경기는 무승부로 집계</span>
              </div>
              <div className="tournament-stat-sort" aria-label="팀 기록 정렬">
                {TEAM_SORT_LABELS.map((sort) => (
                  <button
                    key={sort.id}
                    type="button"
                    className={teamSort === sort.id ? 'is-active' : ''}
                    onClick={() => setTeamSort(sort.id)}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="tournament-stat-team-table-wrap">
              <table className="tournament-stat-team-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>팀</th>
                    <th>경기</th>
                    <th>승</th>
                    <th>무</th>
                    <th>패</th>
                    <th>득</th>
                    <th>실</th>
                    <th>차</th>
                    <th>무실점</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team, index) => (
                    <tr key={team.team}>
                      <td>{index + 1}</td>
                      <th scope="row">
                        <FlagIcon
                          teamName={team.team}
                          fallback={team.teamFlag}
                          className="tournament-stat-team-flag"
                        />
                        <span>{team.team}</span>
                      </th>
                      <td>{team.played}</td>
                      <td>{team.wins}</td>
                      <td>{team.draws}</td>
                      <td>{team.losses}</td>
                      <td>{team.goalsFor}</td>
                      <td>{team.goalsAgainst}</td>
                      <td>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                      <td>{team.cleanSheets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <footer className="tournament-awards-sources tournament-statistics-sources">
          <span>2026. 7. 20. 기준</span>
          <span>경기·팀: 최종 결과 스냅샷</span>
          {TOURNAMENT_STATISTICS_SOURCES.map((source) => (
            <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </footer>
      </section>
    </div>
  );
}
