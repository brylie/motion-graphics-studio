/**
 * Context keys used for dependency injection throughout the application.
 * Using constants prevents typos and improves maintainability.
 */

// Playback-related contexts
export const PLAYBACK_CONTEXT = 'playback';
export const FORMATTED_TIME_CONTEXT = 'formattedTime';
export const PLAYBACK_ACTIONS_CONTEXT = 'playbackActions';

// Timeline-related contexts
export const TIMELINE_CONTEXT = 'timeline';
export const TIMELINE_VIEW_CONTEXT = 'timelineView';
export const TIMELINE_ACTIONS_CONTEXT = 'timelineActions';
export const VIEW_ACTIONS_CONTEXT = 'viewActions';

// Shader-related contexts
export const SHADER_LIBRARY_CONTEXT = 'shaderLibrary';
export const SHADER_LIBRARY_ACTIONS_CONTEXT = 'shaderLibraryActions';

// Drag and drop contexts
export const DRAG_DROP_STORE_CONTEXT = 'dragDropStore';
export const DRAG_DROP_ACTIONS_CONTEXT = 'dragDropActions';
