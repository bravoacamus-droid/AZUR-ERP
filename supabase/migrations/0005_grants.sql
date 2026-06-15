-- Las vistas respetan la RLS del invocador y son accesibles vía API.
alter view v_cajas_saldos set (security_invoker = true);
alter view v_dashboard_proyecto set (security_invoker = true);

grant select on v_cajas_saldos to authenticated;
grant select on v_dashboard_proyecto to authenticated;
