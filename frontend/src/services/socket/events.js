/**
 * Mirror of the server's SocketEvents. Kept in sync manually; a shared package
 * would be the next step if the project grows. Treated as the single client
 * source of truth for event names.
 */
export const SocketEvents = Object.freeze({
  // Client -> Server
  HOST_CREATE_ROOM: 'host:create_room',
  HOST_START_ROUND: 'host:start_round',
  HOST_SKIP_ROUND: 'host:skip_round',
  HOST_NEXT_ROUND: 'host:next_round',
  HOST_END_GAME: 'host:end_game',

  PLAYER_JOIN: 'player:join',
  PLAYER_REJOIN: 'player:rejoin',

  // Server -> Client
  ROOM_STATE: 'room:state',
  ROOM_ERROR: 'room:error',
  TIMER_TICK: 'timer:tick',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  SUBMISSION_SCORED: 'submission:scored',
  PLAYER_JOINED: 'player:joined',
  STATE_CHANGED: 'state:changed',
});

/** Authoritative game states (mirror of server constants). */
export const GameState = Object.freeze({
  WAITING_ROOM: 'WAITING_ROOM',
  ROUND_STARTING: 'ROUND_STARTING',
  SEARCHING: 'SEARCHING',
  SUBMISSIONS_CLOSED: 'SUBMISSIONS_CLOSED',
  AI_PROCESSING: 'AI_PROCESSING',
  RESULTS: 'RESULTS',
  NEXT_ROUND: 'NEXT_ROUND',
  GAME_FINISHED: 'GAME_FINISHED',
});
