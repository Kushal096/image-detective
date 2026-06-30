/**
 * Shared, immutable game constants used across server and (mirrored) client.
 */

/** Authoritative game state machine states. */
export const GameState = Object.freeze({
  WAITING_ROOM: "WAITING_ROOM",
  ROUND_STARTING: "ROUND_STARTING",
  SEARCHING: "SEARCHING",
  SUBMISSIONS_CLOSED: "SUBMISSIONS_CLOSED",
  AI_PROCESSING: "AI_PROCESSING",
  RESULTS: "RESULTS",
  NEXT_ROUND: "NEXT_ROUND",
  GAME_FINISHED: "GAME_FINISHED",
});

/** Socket.IO event names. Single source of truth shared by client mirror. */
export const SocketEvents = Object.freeze({
  // Connection lifecycle
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Client -> Server (Host)
  HOST_CREATE_ROOM: "host:create_room",
  HOST_ADD_ROUND: "host:add_round",
  HOST_REMOVE_ROUND: "host:remove_round",
  HOST_UPDATE_ROUND: "host:update_round",
  HOST_REORDER_ROUNDS: "host:reorder_rounds",
  HOST_ADD_SUB_ROUND: "host:add_sub_round",
  HOST_REMOVE_SUB_ROUND: "host:remove_sub_round",
  HOST_UPDATE_SUB_ROUND: "host:update_sub_round",
  HOST_START_GAME: "host:start_game",
  HOST_START_ROUND: "host:start_round",
  HOST_PAUSE_ROUND: "host:pause_round",
  HOST_RESUME_ROUND: "host:resume_round",
  HOST_SKIP_ROUND: "host:skip_round",
  HOST_END_ROUND: "host:end_round",
  HOST_NEXT_ROUND: "host:next_round",
  HOST_END_GAME: "host:end_game",
  HOST_SET_TARGET: "host:set_target",

  // Client -> Server (Player)
  PLAYER_JOIN: "player:join",
  PLAYER_SUBMIT: "player:submit",
  PLAYER_REJOIN: "player:rejoin",

  // Server -> Client
  ROOM_STATE: "room:state",
  ROOM_ERROR: "room:error",
  TIMER_TICK: "timer:tick",
  LEADERBOARD_UPDATE: "leaderboard:update",
  SUBMISSION_ACK: "submission:ack",
  SUBMISSION_SCORED: "submission:scored",
  SUBMISSION_RECEIVED: "submission:received",
  PLAYER_JOINED: "player:joined",
  PLAYER_LEFT: "player:left",
  PLAYER_RECONNECTED: "player:reconnected",
  STATE_CHANGED: "state:changed",
  ROUND_COMPLETED: "round:completed",
  ROUND_RESULTS: "round:results",
  GAME_FINISHED: "game:finished",
});

export const ROUND_STARTING_DELAY_MS = 3000;
export const MAX_SCORE = 100;

/** Submissions this similar to the clue image are treated as clue reuse (score 0). */
export const HINT_REUSE_THRESHOLD = 0.86;
