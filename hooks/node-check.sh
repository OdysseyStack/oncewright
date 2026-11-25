# SessionStart, in shell form so it runs where Node can't: every other hook is a Node script, and
# without Node.js 22 or later they can't start, so they guard nothing. Silent when Node is fine,
# so a working session's context gets nothing from it.
# shortcut: on Windows it needs Git Bash, which Git for Windows brings; with only PowerShell it fails to start.
v=$(node --version 2>/dev/null)
v=${v%%[!v0-9.]*} # cut at the first other character (a CR, a newline, a quote), so it can't break the JSON below
major=${v#v}
major=${major%%.*}
case $major in '' | *[!0-9]*) major=0 ;; esac
[ "$major" -ge 22 ] && exit 0
found=${v:+Node.js $v}
printf '{"systemMessage":"Odyssey: the kit%ss guards and hooks are off in this session: they need Node.js 22 or later, and found %s. Install Node.js 22 or later, then start a new session."}\n' "'" "${found:-no node command}"
