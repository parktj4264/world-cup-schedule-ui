import type { Match } from '../data/schedule';

export type TeamTournamentStats = {
  team: string;
  teamFlag: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
};

export type TournamentMatchRecord = {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  totalGoals: number;
  goalDifference: number;
};

export type TournamentStatistics = {
  teamCount: number;
  matchCount: number;
  totalGoals: number;
  goalsPerMatch: number;
  draws: number;
  shootouts: number;
  goallessDraws: number;
  cleanSheets: number;
  groupGoals: number;
  knockoutGoals: number;
  highestScoringMatches: TournamentMatchRecord[];
  biggestWins: TournamentMatchRecord[];
  teams: TeamTournamentStats[];
};

const hasFinalScore = (match: Match): match is Match & { homeScore: number; awayScore: number } =>
  match.status === 'finished' &&
  typeof match.homeScore === 'number' &&
  typeof match.awayScore === 'number';

const createTeamStats = (team: string, teamFlag: string): TeamTournamentStats => ({
  team,
  teamFlag,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  cleanSheets: 0,
});

export const calculateTournamentStatistics = (matches: Match[]): TournamentStatistics => {
  const finishedMatches = matches.filter(hasFinalScore);
  const teamMap = new Map<string, TeamTournamentStats>();
  let totalGoals = 0;
  let draws = 0;
  let shootouts = 0;
  let goallessDraws = 0;
  let cleanSheets = 0;
  let groupGoals = 0;

  const records = finishedMatches.map((match) => {
    const homeStats = teamMap.get(match.home) ?? createTeamStats(match.home, match.homeFlag);
    const awayStats = teamMap.get(match.away) ?? createTeamStats(match.away, match.awayFlag);
    const matchGoals = match.homeScore + match.awayScore;
    const goalDifference = Math.abs(match.homeScore - match.awayScore);

    homeStats.played += 1;
    homeStats.goalsFor += match.homeScore;
    homeStats.goalsAgainst += match.awayScore;
    awayStats.played += 1;
    awayStats.goalsFor += match.awayScore;
    awayStats.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      homeStats.wins += 1;
      awayStats.losses += 1;
    } else if (match.awayScore > match.homeScore) {
      awayStats.wins += 1;
      homeStats.losses += 1;
    } else {
      homeStats.draws += 1;
      awayStats.draws += 1;
      draws += 1;
    }

    if (match.awayScore === 0) {
      homeStats.cleanSheets += 1;
      cleanSheets += 1;
    }

    if (match.homeScore === 0) {
      awayStats.cleanSheets += 1;
      cleanSheets += 1;
    }

    if (match.homeScore === 0 && match.awayScore === 0) {
      goallessDraws += 1;
    }

    if (
      typeof match.homePenaltyScore === 'number' &&
      typeof match.awayPenaltyScore === 'number'
    ) {
      shootouts += 1;
    }

    totalGoals += matchGoals;

    if (match.stage === 'group') {
      groupGoals += matchGoals;
    }

    teamMap.set(match.home, homeStats);
    teamMap.set(match.away, awayStats);

    return {
      id: match.id,
      home: match.home,
      away: match.away,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      totalGoals: matchGoals,
      goalDifference,
    };
  });

  const teams = Array.from(teamMap.values())
    .map((team) => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
    }))
    .sort(
      (left, right) =>
        right.wins - left.wins ||
        right.goalDifference - left.goalDifference ||
        right.goalsFor - left.goalsFor ||
        left.team.localeCompare(right.team, 'ko'),
    );
  const highestGoalCount = Math.max(0, ...records.map((record) => record.totalGoals));
  const biggestGoalDifference = Math.max(0, ...records.map((record) => record.goalDifference));

  return {
    teamCount: teams.length,
    matchCount: finishedMatches.length,
    totalGoals,
    goalsPerMatch: finishedMatches.length > 0 ? totalGoals / finishedMatches.length : 0,
    draws,
    shootouts,
    goallessDraws,
    cleanSheets,
    groupGoals,
    knockoutGoals: totalGoals - groupGoals,
    highestScoringMatches: records.filter((record) => record.totalGoals === highestGoalCount),
    biggestWins: records.filter((record) => record.goalDifference === biggestGoalDifference),
    teams,
  };
};
