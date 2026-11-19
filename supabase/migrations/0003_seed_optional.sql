-- docs/spec.md 7.1. 씨앗은 가입한 뒤 씨앗 고르기 화면에서 정한다. 그 전에는 비어 있다.
-- Supabase SQL Editor에서 한 번 실행한다(spec 11.1). 이미 가입한 구성원의 씨앗은 그대로다
alter table public.profiles alter column seed drop not null;
