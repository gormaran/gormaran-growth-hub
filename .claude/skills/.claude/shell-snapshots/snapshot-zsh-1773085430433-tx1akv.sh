# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
# Functions
# Shell Options
setopt nohashdirs
setopt login
# Aliases
alias -- run-help=man
alias -- which-command=whence
# Check for rg availability
if ! (unalias rg 2>/dev/null; command -v rg) >/dev/null 2>&1; then
  function rg {
  if [[ -n $ZSH_VERSION ]]; then
    ARGV0=rg /Users/gabiorma/.vscode/extensions/anthropic.claude-code-2.1.71-darwin-arm64/resources/native-binary/claude "$@"
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    ARGV0=rg /Users/gabiorma/.vscode/extensions/anthropic.claude-code-2.1.71-darwin-arm64/resources/native-binary/claude "$@"
  elif [[ $BASHPID != $$ ]]; then
    exec -a rg /Users/gabiorma/.vscode/extensions/anthropic.claude-code-2.1.71-darwin-arm64/resources/native-binary/claude "$@"
  else
    (exec -a rg /Users/gabiorma/.vscode/extensions/anthropic.claude-code-2.1.71-darwin-arm64/resources/native-binary/claude "$@")
  fi
}
fi
export PATH=/opt/homebrew/opt/postgresql\@16/bin\:/opt/homebrew/opt/postgresql\@16/bin\:/opt/homebrew/bin\:/opt/homebrew/sbin\:/usr/local/bin\:/System/Cryptexes/App/usr/bin\:/usr/bin\:/bin\:/usr/sbin\:/sbin\:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin\:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin\:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin
