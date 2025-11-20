# ERROR SAAT LOGIN DENGAN AKUN: admin@canvastencil.com

## CEK File: `backend\database\seeders\PlatformSeeder.php`
    - Platform Account : admin@canvastencil.com : SuperAdmin2024!
    - Tenant Account   : admin@demo-etching.com : DemoAdmin2024!


# ERROR LOGS:
client.ts:43 [2025-11-20T12:30:03.269Z] [API Client] [DEBUG] POST /auth/login {headers: AxiosHeaders, data: {…}}
client.ts:43 [2025-11-20T12:30:05.607Z] [API Client] [WARN] Network error Network Error
installHook.js:1 [Auth] {message: 'Network Error', userMessage: 'An error occurred.', severity: 'medium', code: undefined, details: null, …}
overrideMethod @ installHook.js:1
console.error @ chunk-BV2DM43N.js?v=7a52ab29:18167
handleApiError @ errorHandler.ts:132
(anonymous) @ useAuthState.ts:37
(anonymous) @ useAuthState.ts:52
await in (anonymous)
handleSubmit @ Login.tsx:50
callCallback2 @ chunk-NFC5BX5N.js?v=7a52ab29:3674
invokeGuardedCallbackDev @ chunk-NFC5BX5N.js?v=7a52ab29:3699
invokeGuardedCallback @ chunk-NFC5BX5N.js?v=7a52ab29:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-NFC5BX5N.js?v=7a52ab29:3736
executeDispatch @ chunk-NFC5BX5N.js?v=7a52ab29:7014
processDispatchQueueItemsInOrder @ chunk-NFC5BX5N.js?v=7a52ab29:7034
processDispatchQueue @ chunk-NFC5BX5N.js?v=7a52ab29:7043
dispatchEventsForPlugins @ chunk-NFC5BX5N.js?v=7a52ab29:7051
(anonymous) @ chunk-NFC5BX5N.js?v=7a52ab29:7174
batchedUpdates$1 @ chunk-NFC5BX5N.js?v=7a52ab29:18913
batchedUpdates @ chunk-NFC5BX5N.js?v=7a52ab29:3579
dispatchEventForPluginEventSystem @ chunk-NFC5BX5N.js?v=7a52ab29:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NFC5BX5N.js?v=7a52ab29:5478
dispatchEvent @ chunk-NFC5BX5N.js?v=7a52ab29:5472
dispatchDiscreteEvent @ chunk-NFC5BX5N.js?v=7a52ab29:5449
installHook.js:1 Original Error: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
overrideMethod @ installHook.js:1
console.error @ chunk-BV2DM43N.js?v=7a52ab29:18167
handleApiError @ errorHandler.ts:135
(anonymous) @ useAuthState.ts:37
(anonymous) @ useAuthState.ts:52
await in (anonymous)
handleSubmit @ Login.tsx:50
callCallback2 @ chunk-NFC5BX5N.js?v=7a52ab29:3674
invokeGuardedCallbackDev @ chunk-NFC5BX5N.js?v=7a52ab29:3699
invokeGuardedCallback @ chunk-NFC5BX5N.js?v=7a52ab29:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-NFC5BX5N.js?v=7a52ab29:3736
executeDispatch @ chunk-NFC5BX5N.js?v=7a52ab29:7014
processDispatchQueueItemsInOrder @ chunk-NFC5BX5N.js?v=7a52ab29:7034
processDispatchQueue @ chunk-NFC5BX5N.js?v=7a52ab29:7043
dispatchEventsForPlugins @ chunk-NFC5BX5N.js?v=7a52ab29:7051
(anonymous) @ chunk-NFC5BX5N.js?v=7a52ab29:7174
batchedUpdates$1 @ chunk-NFC5BX5N.js?v=7a52ab29:18913
batchedUpdates @ chunk-NFC5BX5N.js?v=7a52ab29:3579
dispatchEventForPluginEventSystem @ chunk-NFC5BX5N.js?v=7a52ab29:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NFC5BX5N.js?v=7a52ab29:5478
dispatchEvent @ chunk-NFC5BX5N.js?v=7a52ab29:5472
dispatchDiscreteEvent @ chunk-NFC5BX5N.js?v=7a52ab29:5449
auth.ts:112  POST http://localhost:8000/api/v1/auth/login net::ERR_CONNECTION_REFUSED
dispatchXhrRequest @ axios.js?v=7a52ab29:1696
xhr @ axios.js?v=7a52ab29:1573
dispatchRequest @ axios.js?v=7a52ab29:2107
Promise.then
_request @ axios.js?v=7a52ab29:2310
request @ axios.js?v=7a52ab29:2219
httpMethod @ axios.js?v=7a52ab29:2356
wrap @ axios.js?v=7a52ab29:8
login @ auth.ts:112
(anonymous) @ useAuthState.ts:46
handleSubmit @ Login.tsx:50
callCallback2 @ chunk-NFC5BX5N.js?v=7a52ab29:3674
invokeGuardedCallbackDev @ chunk-NFC5BX5N.js?v=7a52ab29:3699
invokeGuardedCallback @ chunk-NFC5BX5N.js?v=7a52ab29:3733
invokeGuardedCallbackAndCatchFirstError @ chunk-NFC5BX5N.js?v=7a52ab29:3736
executeDispatch @ chunk-NFC5BX5N.js?v=7a52ab29:7014
processDispatchQueueItemsInOrder @ chunk-NFC5BX5N.js?v=7a52ab29:7034
processDispatchQueue @ chunk-NFC5BX5N.js?v=7a52ab29:7043
dispatchEventsForPlugins @ chunk-NFC5BX5N.js?v=7a52ab29:7051
(anonymous) @ chunk-NFC5BX5N.js?v=7a52ab29:7174
batchedUpdates$1 @ chunk-NFC5BX5N.js?v=7a52ab29:18913
batchedUpdates @ chunk-NFC5BX5N.js?v=7a52ab29:3579
dispatchEventForPluginEventSystem @ chunk-NFC5BX5N.js?v=7a52ab29:7173
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NFC5BX5N.js?v=7a52ab29:5478
dispatchEvent @ chunk-NFC5BX5N.js?v=7a52ab29:5472
dispatchDiscreteEvent @ chunk-NFC5BX5N.js?v=7a52ab29:5449
