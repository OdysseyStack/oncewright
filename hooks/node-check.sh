# SessionStart, in shell form so it runs where Node can't: every other hook is a Node script, and
# without a node command they can't start. The secrets guard then blocks each call it covers (its
# "onFailure": "block" in hooks.json), and the rest guard nothing. Silent when Node is fine,
# so a working session's context gets nothing from it.
# shortcut: on Windows it needs Git Bash, which Git for Windows brings; with only PowerShell it fails to start.
out=$(node --version 2>/dev/null)
v=
# The last line that starts with v and a digit: a version manager's shim may print a warning first.
while IFS= read -r line; do
  case $line in v[0-9]*) v=$line ;; esac
done <<EOF
$out
EOF
v=${v%%[!v0-9.]*} # cut at the first other character (a CR, a quote), so it can't break the JSON below
major=${v#v}
major=${major%%.*}
case $major in '' | *[!0-9]*) major=0 ;; esac
[ "$major" -ge 22 ] && exit 0
found=${v:+Node.js $v, so some may not work}
printf '{"systemMessage":"Odyssey: the kit%ss hooks need Node.js 22 or later, and found %s. Install Node.js 22 or later, then start a new session, or turn the kit off with claude plugin disable odyssey."}\n' "'" "${found:-no node command, so from Claude Code 2.1.295 the secrets guard blocks every edit and shell command (an older release lets them through unguarded)}"
