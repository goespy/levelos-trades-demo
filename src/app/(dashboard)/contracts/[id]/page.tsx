"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractDocument } from "@/components/contract-document";
import { normalizeContractData, type ContractEnvelope, type ContractFields } from "@/lib/contract-document";
type ContractRecord={status:string;contractData:string|null;signatureData:string|null;shareToken:string|null};
export default function ContractDetailPage(){
 const {id}=useParams<{id:string}>(),router=useRouter();const [record,setRecord]=useState<ContractRecord|null>(null),[envelope,setEnvelope]=useState<ContractEnvelope|null>(null),[saving,setSaving]=useState(false);
 const load=useCallback(async()=>{const response=await fetch(`/api/contracts/${id}`);if(!response.ok)return router.push("/contracts");const value:ContractRecord=await response.json();setRecord(value);setEnvelope(normalizeContractData(value.contractData?JSON.parse(value.contractData):{}))},[id,router]);useEffect(()=>{load()},[load]);
 if(!record)return <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin"/></div>;
 const signed=record.status==="SIGNED";let signature=null;try{signature=record.signatureData?JSON.parse(record.signatureData):null}catch{}
 const save=async()=>{if(!envelope)return;setSaving(true);await fetch(`/api/contracts/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({contractData:JSON.stringify(envelope)})});setSaving(false);load()};
 const send=async()=>{await save();await fetch(`/api/contracts/${id}/share`,{method:"POST"});load()};
 const copy=async()=>{if(record.shareToken)await navigator.clipboard.writeText(`${window.location.origin}/c/${record.shareToken}`)};
 return <div><div className="mb-4 flex flex-wrap gap-2 print:hidden"><Button variant="outline" size="sm" onClick={()=>router.back()}><ArrowLeft/>Back</Button><Button variant="outline" size="sm" onClick={()=>window.print()}><Printer/>Print</Button>{record.shareToken&&<><Button variant="outline" size="sm" onClick={copy}>Copy public link</Button><Button variant="outline" size="sm" asChild><a target="_blank" href={`/c/${record.shareToken}`}><ExternalLink/>Public view</a></Button></>}{!signed&&<><Button size="sm" onClick={save} disabled={saving}>{saving?<Loader2 className="animate-spin"/>:<Save/>}Save</Button>{record.status==="DRAFT"&&<Button size="sm" variant="outline" onClick={send}>Send to client</Button>}{record.status==="SENT"&&<span className="self-center text-xs text-muted-foreground">Awaiting customer signature</span>}</>}</div>{signed&&<p className="mb-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">Signed contract — edits are locked. Audit evidence is retained in the internal record.</p>}<ContractDocument data={envelope??normalizeContractData({})} editable={!signed} onChange={(fields:ContractFields)=>setEnvelope(current=>current?{...current,fields}:current)} signature={signature}/></div>;
}
