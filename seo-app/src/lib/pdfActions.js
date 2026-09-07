export async function downloadRemotePdf(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Attached PDF could not be downloaded");
  const blob = new Blob([await response.blob()], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export async function shareRemotePdf(url, title) {
  if (navigator.share) {
    await navigator.share({ title, url });
    return;
  }
  await navigator.clipboard.writeText(url);
}
