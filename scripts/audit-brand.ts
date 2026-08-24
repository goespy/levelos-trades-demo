import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const root=process.cwd(), ignored=new Set(["node_modules",".next",".git",".vercel","src/generated"]), binary=new Set([".db",".png",".jpg",".jpeg",".webp",".avif",".mp4",".ico",".woff",".woff2"]), files:string[]=[];
function walk(dir:string){for(const name of readdirSync(dir)){if(ignored.has(name))continue;const path=join(dir,name),stat=statSync(path);if(stat.isDirectory())walk(path);else if(!binary.has(name.slice(name.lastIndexOf(".")).toLowerCase()))files.push(path)}}
walk(root);
const banned=[/pelican\s*bay/ig,/pelican-bay/ig,/pelican_bay/ig,/pelican-bay-operations-demo/ig,/\bpb(?:Signature|Date|Initials\d+[ab]|Contract|Buyer)\b/ig,/\>\s*PB\s*\</g,/(["'`])PB\1/g,/goscpy/ig];const violations:string[]=[];
for(const file of files){if(file.endsWith("audit-brand.ts"))continue;const text=readFileSync(file,"utf8");for(const rule of banned){rule.lastIndex=0;if(rule.test(text))violations.push(`${relative(root,file)}: ${rule}`)}}
if(violations.length){console.error(violations.join("\n"));process.exit(1)}
console.log(`Brand audit passed (${files.length} text files scanned; generated, binary, node_modules, .next, and .git excluded)`);
