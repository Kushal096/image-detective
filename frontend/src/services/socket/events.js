/**
 * Mirror of the server's SocketEvents. Kept in sync manually; a shared package
 * would be the next step if the project grows. Treated as the single client
 * source of truth for event names.
 */
export const SocketEvents = Object.freeze({
  // Client -> Server (Host)
  HOST_CREATE_ROOM: "host:create_room",
  HOST_REJOIN: "host:rejoin",
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
  HOST_REMOVE_PLAYER: "host:remove_player",

  // Client -> Server (Player)
  PLAYER_JOIN: "player:join",
  PLAYER_REJOIN: "player:rejoin",

  // Server -> Client
  ROOM_STATE: "room:state",
  ROOM_ERROR: "room:error",
  TIMER_TICK: "timer:tick",
  LEADERBOARD_UPDATE: "leaderboard:update",
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

/** Authoritative game states (mirror of server constants). */
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
