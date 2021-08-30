export function saveFile(text: string, fileName: string, contentType: string='text/plain') {
    var a = document.createElement("a");
    var file = new Blob([text], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}