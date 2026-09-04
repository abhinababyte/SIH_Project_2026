<div align="center">
    
![Hill Shield Logo](./hillshield_bg_remove.png)

# Hill Shield

</div>

## Overview

A Flood prediction app specifically designed to help the ones in need.

## Getting Started

### Prerequisites

- bun (javascript runtime and package manager)
- uv (python project manager)
- tmux (terminal multiplexer)
- task (task runner, alternative of make)

### Installation

1. bun
    
    - Linux & macOS: `curl -fsSL https://bun.sh/install | bash`
    - Windows: `powershell -c "irm bun.sh/install.ps1|iex"`  
    [See More](https://bun.sh/docs/quickstart)

2. uv

    - Linux & macOS: `curl -LsSf https://astral.sh/uv/install.sh | sh`
    - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`  
    [See More](https://docs.astral.sh/uv/getting-started/installation/)

3. tmux

    - Linux & macOS: *Available to mostly all package managers*
    - Windows: *Not Available*  ([psmux](https://github.com/psmux/psmux#installation) can be an alternative)  
    [See More](https://github.com/tmux/tmux/wiki/Installing)  
    [Key bindings](https://tmuxcheatsheet.com/)

4. task

    - Universal: `npm install -g @go-task/cli`
    - winget: `winget install Task.Task`  
    *Note: `task` is available to every major package managers, also [check this out](https://taskfile.dev/docs/installation)*

### Dev Usage

``` bash
task dev:all            # starts all servers in different windows in a tmux session
task dev:split          # starts all servers in different panes in a tmux session
task stop               # stops the tmux session
```

---
