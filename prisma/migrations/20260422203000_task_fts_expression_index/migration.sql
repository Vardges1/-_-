-- Expression GIN index for list search when `q` uses PostgreSQL FTS (see task.repository.ts).
CREATE INDEX "Task_title_description_fts_idx" ON "Task" USING gin (
  (to_tsvector('simple', COALESCE("title", '') || ' ' || COALESCE("description", '')))
);
