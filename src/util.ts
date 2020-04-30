export function issueNumFromURL(url: string): number {
  const parts = url.split("/");
  if (parts.length < 2) {
    throw "NaN issue num from content_url";
  }
  const num = Number(parts[parts.length - 1]);
  if (isNaN(num) || parts[parts.length - 2] !== "issues") {
    throw "NaN issue num from content_url";
  }
  return num;
}
