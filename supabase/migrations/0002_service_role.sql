-- docs/spec.md 7.1. 새 프로젝트는 새 테이블에 service_role 권한을 자동으로 주지 않는다.
-- 서버 액션의 secret key 클라이언트가 읽고 쓸 수 있게 한다(spec 7.3)
grant select, insert, update, delete on public.profiles, public.attendance to service_role;
