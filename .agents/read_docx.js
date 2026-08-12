const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install mammoth temporarily or use JS zip parser
try {
  const docxPath = path.join(__dirname, '..', 'docs', 'Contrato_REV_Patrick_Midia_Eleitoral_Chatbot_2026 (1).docx');
  console.log('DOCX Path:', docxPath);
  
  // Use PowerShell ZipArchive
  const psCmd = `powershell -Command "[Reflection.Assembly]::LoadWithPartialName('System.IO.Compression.FileSystem'); $zip = [System.IO.Compression.ZipFile]::OpenRead('${docxPath}'); $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }; $stream = $entry.Open(); $reader = New-Object System.IO.StreamReader($stream); $xml = $reader.ReadToEnd(); $reader.Close(); $stream.Close(); $zip.Dispose(); $xml"`;
  
  const xml = execSync(psCmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
  const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  console.log('--- EXTRACTED CONTRACT TEXT ---');
  console.log(text.slice(0, 4000));
} catch (e) {
  console.error(e);
}
