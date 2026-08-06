# V12.2 Private Beta Dashboard

Create this dashboard in the private analytics provider after the production project token is configured. Do not build a public dashboard inside Everlasting Voyage.

## Required insights

1. Voyages started — count of `voyage_started`.
2. Voyages completed — count of `voyage_completed`.
3. Completion rate — completed / started by Voyage session ID.
4. Voyages abandoned — count of `voyage_abandoned`, split by `exit_method` and `elapsed_bucket`.
5. Returning visitors — count of `returning_visit`, split by `visit_gap_bucket`.
6. Top selected states — `state_selected` by `state`.
7. Top durations — `duration_selected` by `duration_bucket` and `duration_minutes`.
8. Most-used Atmosphere layers — `atmosphere_layer_added` by `layer_id` and `layer_type`.
9. Audio failures by layer — `audio_load_failed` by `layer_id`, `failure_code` and `source_attempt`.
10. Retry recovery usage — `audio_retry_used` by `layer_id`.
11. Saved Spaces created — count of `saved_space_created`.
12. Saved Spaces restored — count of `saved_space_restored`.
13. Feedback rating distribution — `feedback_submitted` by `rating`.
14. Problem categories — problem feedback by `issue_area`.

## Project privacy settings

- Keep autocapture disabled.
- Keep session replay disabled.
- Keep heatmaps and surveys disabled.
- Do not create identified person profiles.
- Do not enable IP or geographic enrichment for these events.
- Confirm the final event-retention window before public launch.
- Never add intention, thought, Notes, Saved Space names, feedback comments, raw errors or URLs as properties.

## Environment activation

Production capture remains off until all of these are set intentionally:

- `NEXT_PUBLIC_BETA_ANALYTICS_ENABLED=true`
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` or `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

The application must remain fully functional when these are absent.
