// The copies /odyssey:setup makes outside the plugin, in the user's Claude Code folder: the status
// bar, the mods and the launcher. `claude plugin update` replaces the plugin's own files, never these,
// so each check compares a copy with this kit version's source. Shared by scripts/odyssey.mjs
// (status, doctor, setup's installs) and hooks/session-start.mjs (the notice after an update).
import { readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Claude Code keeps the user's settings in CLAUDE_CONFIG_DIR when it is set; the trust file stays in ~/.claude.
export const claudeHome = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
export const userSettings = () => path.join(claudeHome(), "settings.json");

// -> "missing" | "same" | "differs": a copy against this kit version's file.
const compare = (copy, source) => {
  try {
    return readFileSync(copy).equals(readFileSync(source)) ? "same" : "differs";
  } catch {
    return "missing";
  }
};

export const barFile = () => path.join(claudeHome(), "odyssey-statusline.mjs");
export const BAR_SOURCE = path.join(PLUGIN, "scripts", "statusline.mjs");
export const runsBar = (entry) => typeof entry?.command === "string" && entry.command.includes("odyssey-statusline.mjs");
export const barScript = () => compare(barFile(), BAR_SOURCE);

// The kit's mods, in mods/: each loaded only from a folder that CLAUDE_CODE_PLUGIN_DIRS names, a
// list Claude Code reads at startup and splits on the OS's path separator (`;` on Windows, `:`
// elsewhere). Peek, the experimental file viewer, refuses every file until it can read the
// secrets guard's patterns from the copy beside it; wrap-up, the band past the wrap-up mark,
// needs nothing beside it.
export const DIRS = "CLAUDE_CODE_PLUGIN_DIRS";
const GUARD_SOURCE = path.join(PLUGIN, "hooks", "protect-env.mjs");
export const MODS = {
  peek: {
    label: "Peek",
    extra: { "protect-env.mjs": GUARD_SOURCE },
    copied: " with the kit's secret-file patterns",
    use: "type /peek in one",
    older: ", so its secret-file patterns may be older",
  },
  "wrap-up": { label: "Wrap-up", extra: {}, copied: "", use: "its band shows once a session passes the wrap-up mark", older: "" },
};
export const modSource = (name) => path.join(PLUGIN, "mods", name);
export const modDir = (name) => path.join(claudeHome(), `odyssey-${name}`);
// The folders the settings' list names; null when `env` or the list isn't what Claude Code reads.
export function dirsOf(settings) {
  const env = settings.env;
  if (env === undefined) return [];
  if (env === null || typeof env !== "object" || Array.isArray(env)) return null;
  const list = env[DIRS];
  if (list === undefined) return [];
  return typeof list === "string" ? list.split(path.delimiter).map((dir) => dir.trim()).filter(Boolean) : null;
}
export const isMod = (name) => (dir) => path.resolve(dir.replace(/^~(?=$|[\\/])/, os.homedir())) === modDir(name);
// Every file in a folder, by its path inside it, but `.claude-plugin/types/`, which Claude Code
// writes into a mod's folder when it loads the mod.
const filesIn = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== ".DS_Store") // macOS Finder litter is no difference
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .filter((file) => !file.startsWith(path.join(".claude-plugin", "types") + path.sep))
    .sort();
// -> "missing" | "same" | "differs": the copy in ~/.claude against this kit version's mod and
// the files beside it.
export function modCopy(name) {
  let copy;
  try {
    copy = filesIn(modDir(name));
  } catch {
    return "missing";
  }
  const { extra } = MODS[name];
  const kit = [...filesIn(modSource(name)), ...Object.keys(extra)].sort();
  const source = (file) => (Object.hasOwn(extra, file) ? extra[file] : path.join(modSource(name), file));
  const same = copy.length === kit.length && kit.every((file, i) => copy[i] === file && readFileSync(path.join(modDir(name), file)).equals(readFileSync(source(file))));
  return same ? "same" : "differs";
}

export const LAUNCH_SOURCE = path.join(PLUGIN, "scripts", "launch.mjs");
export const launchFile = () => path.join(claudeHome(), "odyssey-launch.mjs");
export const launchCopy = () => compare(launchFile(), LAUNCH_SOURCE);

// The copies the user's settings run (the launcher: once it is copied) that differ from this kit
// version's, by path. A missing copy is doctor's to report.
export function staleCopies() {
  let user = null;
  try {
    user = JSON.parse(readFileSync(userSettings(), "utf8"));
  } catch {
    // No settings, or settings that aren't JSON: nothing the settings run.
  }
  const stale = [];
  if (runsBar(user?.statusLine) && barScript() === "differs") stale.push(barFile());
  for (const name of Object.keys(MODS)) {
    if (dirsOf(user ?? {})?.some(isMod(name)) && modCopy(name) === "differs") stale.push(modDir(name));
  }
  if (launchCopy() === "differs") stale.push(launchFile());
  return stale;
}
