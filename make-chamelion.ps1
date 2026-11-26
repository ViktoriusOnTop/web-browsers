
$ErrorActionPreference = "Stop"

# Change to the directory containing this script
Set-Location -LiteralPath $PSScriptRoot
$ROOT = (Get-Location).Path

# Initial confirmation
$response = Read-Host "This will take about 45 mins and use a lot of RAM and CPU. Do you want to continue? [y/N]"

if ($response -match '^(y|ye|yes)$') {
    Write-Host "Starting process..."
}
else {
    Write-Host "Aborted."
    exit 1
}

# Check for spaces in the root directory
if ($ROOT.Contains(" ")) {
    Write-Error "'$ROOT' contains a space... remove it at once."
    $NEWROOT = $ROOT -replace ' ', '-'
    Write-Host "Run: Move-Item `"$ROOT`" `"$NEWROOT`""
    exit 1
}

# Check required tools
$tools = @("node", "pnpm", "rustc", "cargo")

foreach ($tool in $tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "make-chameleon.ps1: missing $tool on PATH :("
        exit 1
    }
}

# Check Firefox directory
if (-not (Test-Path "chameleon/firefox" -PathType Container)) {
    Write-Host ">> firefox/ missing, i'll clone it but it'll cost you"
}

# Check Python version
$pythonCommand = Get-Command python3 -ErrorAction SilentlyContinue

if (-not $pythonCommand) {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
}

if ($pythonCommand) {
    $pyver = & $pythonCommand.Source -c "import sys; print(sys.version_info[0] * 100 + sys.version_info[1])"

    if ([int]$pyver -gt 312) {
        foreach ($candidate in @("python3.12", "python3.11")) {
            $python = Get-Command $candidate -ErrorAction SilentlyContinue

            if ($python) {
                Write-Host ">> Python version is too new. Using $candidate instead, but it might not work."

                # Prioritize the compatible Python executable
                $env:PATH = "$($python.Source | Split-Path -Parent);$env:PATH"
                break
            }
        }
    }
}

# Build Chameleon
Write-Host "Building Chameleon..."
& make -C chameleon web

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed."
    exit $LASTEXITCODE
}

# Final confirmation
$response = Read-Host "Do you wanna run it? [Y/n]"

if ($response -match '^$|^(y|ye|yes)$') {
    Write-Host "Running..."

    # Run the original launcher through Bash
    if (Get-Command bash -ErrorAction SilentlyContinue) {
        & bash ./run-chameleon.sh
        exit $LASTEXITCODE
    }
    else {
        Write-Error "Bash is required to run run-chameleon.sh. Install Git for Windows or WSL."
        exit 1
    }
}
else {
    Write-Host "donesies"
    exit 1
}
