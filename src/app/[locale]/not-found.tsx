import Link from "next/link";

export default function NotFound() {
  return <main className="page-container" style={{ minHeight: "80vh", display: "grid", alignContent: "center", justifyItems: "start", gap: "20px" }}><h1 style={{ fontSize: "clamp(4rem,10vw,8rem)", fontFamily: "Georgia,serif" }}>404</h1><p>Страница не найдена / Барак табылган жок</p><Link className="button-primary" href="/ru">На главную</Link></main>;
}
