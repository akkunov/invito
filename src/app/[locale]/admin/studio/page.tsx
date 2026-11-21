import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { TemplateStudio } from "@/components/studio/template-studio";
import "@/app/studio.css";

export const metadata:Metadata={
  title:"eventiq Studio — визуальный конструктор шаблонов",
  description:"Локальный визуальный конструктор приглашений eventiq. Публикация и доступ администратора пока не подключены.",
  robots:{index:false,follow:false},
};
export default async function StudioPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  return <TemplateStudio locale={locale}/>;
}
