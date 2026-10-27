# Evidence records

Completion records live here and follow [TASK_EVIDENCE.md](../docs/agents/TASK_EVIDENCE.md) and the [JSON template](../templates/EVIDENCE.json). A record maps actual checks and immutable artifacts to explicit task acceptance IDs and an existing tested implementation commit.

Do not invent a passing run, source digest, device capture, owner approval or public URL. Do not overwrite old evidence after regression: add a new record and preserve history. Generated temporary build artifacts remain ignored; copy only useful, non-sensitive evidence into a stable committed path or record an accessible CI artifact URL and its retention limitations.

Source edits and evidence/state metadata generally require separate checkpoints: first publish the implementation, then record its actual SHA and results. No completed game or production artwork is implied by repository-validation evidence.
