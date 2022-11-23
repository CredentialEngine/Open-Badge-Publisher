This API is for localhost development environment (`vite dev`) and adapter-auto build deployments only. It will not be
used when deployed on the same domain as the publisher API when the app is deployed with adapter-static.

To deploy with adapter-static on the same domain as a Credential Engine Publisher environment, set
`ADAPTER_STATIC="true"` in `.env`, and then `npm run build`. Update`PUBLIC_UI_API_BASEURL` to the publisher route on the
local domain if needed. Typically `/publisher` same as the SvelteKit publisher proxy backend. In this case, the
SvelteKit API is disabled, and the actual Publisher API will be used.
