/**
 * Shared, immutable game constants used across server and (mirrored) client.
 */

/** Authoritative game state machine states. */
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

/** Socket.IO event names. Single source of truth shared by client mirror. */
export const SocketEvents = Object.freeze({
  // Connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Client -> Server
  HOST_CREATE_ROOM: 'host:create_room',
  HOST_START_ROUND: 'host:start_round',
  HOST_SKIP_ROUND: 'host:skip_round',
  HOST_NEXT_ROUND: 'host:next_round',
  HOST_END_GAME: 'host:end_game',
  HOST_SET_TARGET: 'host:set_target',

  PLAYER_JOIN: 'player:join',
  PLAYER_SUBMIT: 'player:submit',
  PLAYER_REJOIN: 'player:rejoin',

  // Server -> Client
  ROOM_STATE: 'room:state',
  ROOM_ERROR: 'room:error',
  TIMER_TICK: 'timer:tick',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  SUBMISSION_ACK: 'submission:ack',
  SUBMISSION_SCORED: 'submission:scored',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  STATE_CHANGED: 'state:changed',
});

export const ROUND_STARTING_DELAY_MS = 3000;
export const MAX_SCORE = 100;
