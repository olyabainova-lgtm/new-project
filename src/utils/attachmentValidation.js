export const MAX_FILES=5
export const MAX_FILE_SIZE=10*1024*1024
export const ALLOWED_EXTENSIONS=['pdf','doc','docx','rtf','txt','ppt','pptx','xls','xlsx','csv','jpg','jpeg','png']
export function validateAttachments(files=[]){const errors=[];if(files.length>MAX_FILES)errors.push(`You may attach up to ${MAX_FILES} files.`);for(const file of files){const ext=file.name.split('.').pop()?.toLowerCase();if(!ALLOWED_EXTENSIONS.includes(ext))errors.push(`${file.name}: unsupported file type.`);if(file.size>MAX_FILE_SIZE)errors.push(`${file.name}: file exceeds 10 MB.`)}return errors}
export const formatFileSize=bytes=>bytes<1024?`${bytes} B`:bytes<1024**2?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1024**2).toFixed(1)} MB`
