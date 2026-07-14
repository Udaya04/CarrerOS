CREATE TABLE IF NOT EXISTS question_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, attempt_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON question_bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_attempt ON question_bookmarks(attempt_id);
