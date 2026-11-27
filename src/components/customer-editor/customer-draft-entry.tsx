"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useCustomerSession} from "@/features/auth/browser/use-customer-session";
import {cancelCustomerRequestWith} from "@/features/auth/browser/supabase-session";
import {getCustomerEditorSource} from "@/features/invitations/customer-cloud";
import {parseProjectV2} from "@/features/studio-v2/core/document.schema";
import {personalizationSchema} from "@/features/studio-v2/core/personalization.schema";
import type {Locale} from "@/i18n/locales";
import {CustomerSignIn} from "./customer-sign-in";
import {CustomerEditorSession,type CustomerEditorProps} from "./customer-mobile-editor";

type Session=ReturnType<typeof useCustomerSession>;

export function CustomerDraftEntry({locale,draftId}:{locale:Locale;draftId:string}){
  const session=useCustomerSession();
  return <DraftEntry key={draftId+":"+(session.scope?.subject??session.status)} locale={locale} draftId={draftId} session={session}/>;
}

function DraftEntry({locale,draftId,session}:{locale:Locale;draftId:string;session:Session}){
  const ru=locale==="ru";
  const {scope}=session;
  const [editor,setEditor]=useState<CustomerEditorProps>();
  const [failed,setFailed]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!scope)return;
    const controller=new AbortController();
    const request=cancelCustomerRequestWith(scope,controller.signal);
    void getCustomerEditorSource(request,draftId).then(({source,draft})=>{
      if(request.signal.aborted)return;
      if(draft.id!==draftId||draft.templateVersionId!==source.versionId)throw Error("DRAFT_SOURCE_MISMATCH");
      setEditor({locale,slug:source.slug,name:source.name,versionId:source.versionId,
        initialDraft:draft,source:parseProjectV2(source.document),
        contract:personalizationSchema.parse(source.personalization),mediaUrls:source.mediaUrls});
    }).catch(()=>{if(!request.signal.aborted)setFailed(true);});
    return()=>controller.abort();
  },[scope,draftId,locale,attempt]);

  if(editor)return <CustomerEditorSession {...editor} session={session}/>;
  return <main className="ce-shell">
    <section className="ce-controls" style={{display:"grid",gap:16,padding:24,maxWidth:480}}>
      <Link href={`/${locale}/invitations`}>{ru?"Мои приглашения":"Менин чакырууларым"}</Link>
      {session.status==="loading"||scope&&!failed
        ?<p role="status">{ru?"Открываем черновик…":"Черновик ачылууда…"}</p>
        :scope?<><p role="alert">{ru?"Черновик недоступен. Проверьте аккаунт и попробуйте ещё раз.":"Черновик жеткиликсиз. Аккаунтту текшерип, кайра аракет кылыңыз."}</p>
          <button type="button" className="ce-primary" onClick={()=>{setFailed(false);setAttempt(n=>n+1);}}>{ru?"Повторить":"Кайталоо"}</button></>
        :session.client?<CustomerSignIn locale={locale} client={session.client} className="ce-cloud-auth" actionClassName="ce-primary"/>
        :<p role="alert">{ru?"Вход сейчас недоступен.":"Кирүү азыр жеткиликсиз."}</p>}
    </section>
  </main>;
}
