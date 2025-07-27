export const IpcMessages = {
  // Window messages
  TOGGLE_CHAT_WINDOW: "clippy_toggle_chat_window",
  MINIMIZE_CHAT_WINDOW: "clippy_minimize_chat_window",
  MAXIMIZE_CHAT_WINDOW: "clippy_maximize_chat_window",
  SET_BUBBLE_VIEW: "clippy_set_bubble_view",
  POPUP_APP_MENU: "clippy_popup_app_menu",

  // State messages
  STATE_CHANGED: "clippy_state_changed",
  STATE_GET_FULL: "clippy_state_get_full",
  STATE_GET: "clippy_state_get",
  STATE_SET: "clippy_state_set",
  STATE_OPEN_IN_EDITOR: "clippy_state_open_in_editor",
  STATE_GET_GOOGLE_API_KEY: "clippy_state_get_google_api_key",

  // Debug messages
  DEBUG_STATE_GET_FULL: "clippy_debug_state_get_full",
  DEBUG_STATE_GET: "clippy_debug_state_get",
  DEBUG_STATE_SET: "clippy_debug_state_set",
  DEBUG_STATE_CHANGED: "clippy_debug_state_changed",
  DEBUG_STATE_OPEN_IN_EDITOR: "clippy_debug_state_open_in_editor",
  DEBUG_GET_DEBUG_INFO: "clippy_debug_get_debug_info",

  // App messages
  APP_CHECK_FOR_UPDATES: "clippy_app_check_for_updates",
  APP_GET_VERSIONS: "clippy_app__get_versions",

  // Chat messages
  CHAT_GET_CHAT_RECORDS: "clippy_chat_get_chat_records",
  CHAT_GET_CHAT_WITH_MESSAGES: "clippy_chat_get_chat_with_messages",
  CHAT_WRITE_CHAT_WITH_MESSAGES: "clippy_chat_write_chat_with_messages",
  CHAT_DELETE_CHAT: "clippy_chat_delete_chat",
  CHAT_DELETE_ALL_CHATS: "clippy_chat_delete_all_chats",
  CHAT_NEW_CHAT: "clippy_chat_new_chat",

  // Grounding Search
  GROUNDING_SEARCH: "clippy_grounding_search",
  GROUNDING_VALIDATE_API_KEY: "clippy_grounding_validate_api_key",

  // Clipboard
  CLIPBOARD_WRITE: "clippy_clipboard_write",

  // Window position tracking for Clippy direction
  GET_WINDOW_POSITIONS: 'GET_WINDOW_POSITIONS',
  GET_SCREEN_INFO: 'GET_SCREEN_INFO',
  CALCULATE_DIRECTION: 'CALCULATE_DIRECTION',
};
