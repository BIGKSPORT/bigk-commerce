import {sharedProducts} from '@/lib/product-groups';
import {suggestMapping,mappedRows,supplierPlan,defaultImportOptions} from '@/lib/supplier-import';
import {z} from 'zod';
import ExcelJS from 'exceljs';
import {products} from '@/lib/db';
import {visibleProducts} from '@/lib/catalog-view';
import {columns,exportRows,writeCsv,readCsvMatrix,rowsToRecords,importPlan,applyProductBatch} from '@/lib/catalog-files';
import {checkOrigin,failure,HttpError,requireAdmin} from '@/lib/security';
export const runtime='nodejs';
export async function GET(req:Request){try{await requireAdmin(req);const params=new URL(req.url).searchParams,ids=params.get('ids')?.split(','),catalog=visibleProducts(sharedProducts(await products())).filter(p=>!ids||ids.includes(p.id)),template=params.get('template')==='1',rows=template?[]:exportRows(catalog),selectedColumns=template?columns.filter(c=>!['productId','variantId','version','priceCents','approved','active','images','verified','archived'].includes(c)).concat([]) as string[]:[...columns],xlsx=params.get('format')==='xlsx';let data:Buffer;if(template)selectedColumns.push('priceEUR');
 if(xlsx){const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Products');sheet.addRow(selectedColumns);for(const row of rows)sheet.addRow(selectedColumns.map(key=>(row as Record<string,string>)[key]||''));sheet.views=[{state:'frozen',ySplit:1}];sheet.columns.forEach(column=>{column.width=24});data=Buffer.from(await book.xlsx.writeBuffer())}else data=Buffer.from(template?'\uFEFF'+selectedColumns.join(',')+'\r\n':writeCsv(rows));
 return Response.json({filename:(template?'bigk-import-template.':'bigk-products.')+(xlsx?'xlsx':'csv'),mime:xlsx?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv;charset=utf-8',data:data.toString('base64')},{headers:{'Cache-Control':'no-store'}})}catch(e){return failure(e)}}
// Reject oversized ZIP expansion before handing an authenticated upload to the workbook reader.
function checkZip(buffer:Buffer){let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break}if(end<0)throw new HttpError(400,'Invalid XLSX archive.');const count=buffer.readUInt16LE(end+10);if(count>2000||count===65535)throw new HttpError(400,'Workbook has too many archive entries.');let cursor=buffer.readUInt32LE(end+16),total=0;for(let i=0;i<count;i++){if(cursor+46>buffer.length||buffer.readUInt32LE(cursor)!==0x02014b50)throw new HttpError(400,'Invalid XLSX directory.');total+=buffer.readUInt32LE(cursor+24);if(total>16777216)throw new HttpError(413,'Expanded workbook exceeds 16 MB.');cursor+=46+buffer.readUInt16LE(cursor+28)+buffer.readUInt16LE(cursor+30)+buffer.readUInt16LE(cursor+32)}}
const optionsSchema=z.object({allowNewProducts:z.boolean(),allowNewVariants:z.boolean(),skipBlank:z.boolean(),includePublication:z.boolean()}).strict();
export async function POST(req:Request){try{
 checkOrigin(req);await requireAdmin(req);const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Choose a file.');let size=0;const chunks:Uint8Array[]=[];
 while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>3145728){await reader.cancel();throw new HttpError(413,'Import files must be below 3 MB.')}chunks.push(r.value)}
 const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData(),file=form.get('file');
 if(!(file instanceof File))throw new HttpError(400,'Choose a CSV or XLSX file.');const buffer=Buffer.from(await file.arrayBuffer());let matrix:string[][]=[],sheets:string[]=[];
 if(file.name.toLowerCase().endsWith('.xlsx')){
  checkZip(buffer);const book=new ExcelJS.Workbook();try{await book.xlsx.load(buffer as any)}catch{throw new HttpError(400,'This workbook could not be read. Save a plain XLSX file without encryption.');}
  sheets=book.worksheets.map(s=>s.name);const sheetName=String(form.get('sheet')||''),sheet=sheetName?book.getWorksheet(sheetName):book.worksheets[0];
  if(!sheet||sheet.rowCount>2020||sheet.columnCount>128)throw new HttpError(400,'Choose a sheet with at most 2,000 data rows and 128 columns.');
  sheet.eachRow({includeEmpty:true},row=>{const cells:string[]=[];for(let i=1;i<=sheet.columnCount;i++){const cell=row.getCell(i);if(cell.type===ExcelJS.ValueType.Formula||cell.type===ExcelJS.ValueType.Hyperlink)throw new HttpError(400,'Formulas and links are not accepted; paste plain values.');cells.push(cell.text)}matrix.push(cells)});
 }else if(file.name.toLowerCase().endsWith('.csv'))matrix=readCsvMatrix(buffer.toString('utf8'));else throw new HttpError(400,'Use a CSV or XLSX file.');
 const headerRow=Number(form.get('headerRow')||1);if(!Number.isInteger(headerRow)||headerRow<1||headerRow>20)throw new HttpError(400,'Choose a header row from 1 to 20.');matrix=matrix.slice(headerRow-1);const headers=matrix[0];if(!headers?.length||headers.length>128)throw new HttpError(400,'The selected header row is empty or too wide.');
 const mode=String(form.get('mode')||'legacy');
 if(mode==='inspect')return Response.json({headers,sheets,sheet:String(form.get('sheet')||sheets[0]||''),sample:matrix.slice(1,6),rowCount:matrix.slice(1).filter(row=>row.some(cell=>cell.trim())).length,mapping:suggestMapping(headers)},{headers:{'Cache-Control':'no-store'}});
 let operations;
 if(mode==='prepare'){
  const mapping=z.record(z.string(),z.string()).safeParse(JSON.parse(String(form.get('mapping')||'{}'))),options=optionsSchema.safeParse(JSON.parse(String(form.get('options')||JSON.stringify(defaultImportOptions))));if(!mapping.success||!options.success)throw new HttpError(400,'Check the import options and column mapping.');
  operations=await supplierPlan(mappedRows(matrix.slice(1),mapping.data,options.data),options.data,headerRow+1);
 }else if(mode==='legacy')operations=await importPlan(rowsToRecords(matrix));else throw new HttpError(400,'Unknown import action.');
 const preview=await applyProductBatch(operations,true);return Response.json({operations,preview},{headers:{'Cache-Control':'no-store'}});
}catch(e){return failure(e)}}
