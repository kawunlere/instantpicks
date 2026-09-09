import { getNav, buildPage } from "./shared.js";
import { getAllPlatforms } from "../engines/platforms.js";

export function renderAnalyze() {
  const nav = getNav("analyze");
  const platforms = getAllPlatforms();
  const platformOptions = platforms.map(p => "<option value=\"" + p.id + "\">" + p.name + " - " + p.game + "</option>").join("");

  var body = "<div class=\"head\"><div class=\"logo\">ANALYZE</div><div class=\"tag\">SMART MATCH ANALYSIS</div></div>";
  body += "<div class=\"card\"><label>PLATFORM</label><select id=\"platform\">" + platformOptions + "</select></div>";
  body += "<div id=\"matches\"></div>";
  body += "<button class=\"btn\" id=\"addBtn\" style=\"background:linear-gradient(135deg,#00cc6a,#009955)\">+ ADD MATCH (Optional - for Accumulator)</button>";
  body += "<button class=\"btn\" id=\"goBtn\" style=\"margin-top:10px\">ANALYZE</button>";
  body += "<div id=\"result\"></div>";
  body += "<script src=\"/analyze-script.js\"></" + "script>";

  return buildPage("ANALYZE", nav, body);
}
