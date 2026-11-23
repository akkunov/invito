import type {ProjectDocumentV2} from "@/features/studio-v2/core/document.schema";
import type {EditableField} from "@/features/studio-v2/core/personalization.schema";

/**
 * Maps the rendered Studio v2 node to an explicitly authorized customer field.
 * Never infer permissions from locked/visible nodes or from DOM attributes.
 */
export function editableFieldForNode(
  document:ProjectDocumentV2,
  fields:readonly EditableField[],
  nodeId:string,
):EditableField|undefined {
  const node=document.nodes[nodeId];
  if(!node)return undefined;
  if(node.type==="image"||node.type==="widget"){
    const field=fields.find(item=>"nodeId" in item&&item.nodeId===nodeId);
    if(field)return field;
  }
  const key=node.type==="text"?node.bindingKey:
    node.type==="widget"&&node.block.kind==="countdown"?node.block.targetKey:
    node.type==="widget"&&node.block.kind==="location"?node.block.addressKey:null;
  return key?fields.find(item=>"key" in item&&item.key===key):undefined;
}
