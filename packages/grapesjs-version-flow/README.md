# @silexlabs/grapesjs-version-flow

A GrapesJS plugin for managing version upgrades and migrations with sequential upgrade flow and modal UI

Detects when a project was saved with an older version of your app, upgrades it step-by-step, and shows progress and changelogs in a modal

> This code is part of a bigger project: [Silex v3](https://www.silex.me)
> This has been vibe coded entirely by @lexoyo, check the `prompts/` folder

[Version Flow Demo](#TODO) // TODO

## 🚀 Features

- **Automatic Version Detection**: Detects when a project was saved with an older application version
- **Sequential Upgrades**: Guides users through upgrades step-by-step in the correct order
- **Modal UI**: Clean, accessible modal interface showing progress, logs, and "What's new"
- **Error Handling**: Comprehensive error handling with retry functionality
- **Internationalization**: Built-in support for multiple languages (EN/FR included)
- **Flexible Configuration**: Customizable styling, version comparison, and error handling
- **Event System**: Rich event system for monitoring upgrade lifecycle
- **Persistence**: Automatic version persistence in project data

## 📦 Installation

### NPM
```bash
npm install @silexlabs/grapesjs-version-flow
```

### CDN
```html
<script src="https://unpkg.com/@silexlabs/grapesjs-version-flow"></script>
```

## 🎯 Quick Start

```javascript
import grapesjs from 'grapesjs';
import versionFlowPlugin from '@silexlabs/grapesjs-version-flow';

const editor = grapesjs.init({
  container: '#gjs',
  plugins: [versionFlowPlugin],
  pluginsOpts: {
    [versionFlowPlugin]: {
      builderVersion: '2.1.0',
      versions: [
        {
          builderVersion: '2.0.0',
          upgrade: (ctx) => {
            // Your upgrade logic here
            ctx.addLog('info', 'Upgrading to v2.0.0');
            // Return logs or nothing
            return [
              { level: 'info', message: 'Migration completed' }
            ];
          },
          whatsNew: (ctx) => {
            // Optional: show what's new
            alert('New features in v2.0.0!');
          }
        }
      ]
    }
  }
});
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `builderVersion` | `string` | **Required** | Current application version |
| `versions` | `VersionStep[]` | **Required** | Array of version upgrade steps |
| `compareFn` | `function` | `null` | Custom version comparison function |
| `continueOnError` | `boolean` | `false` | Whether to continue upgrades after errors |
| `styles.classPrefix` | `string` | `'gjs-version-flow'` | CSS class prefix for styling |
| `styles.injectCSS` | `string` | `null` | Custom CSS to inject |
| `i18n` | `object` | `{}` | Custom translations |

### VersionStep Contract

```typescript
interface VersionStep {
  builderVersion: string;                           // Target version
  upgrade: (ctx: UpgradeContext) => Promise<Log[]> | Log[] | void;  // Upgrade function
  whatsNew?: (ctx: UpgradeContext) => Promise<void> | void;         // Optional what's new
}

interface Log {
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface UpgradeContext {
  editor: Editor;
  getComponents: () => Component[];
  getStyles: () => CSSRule[];
  getPages: () => Page[];
  getProjectData: () => any;
  setProjectData: (data: any) => void;
  addLog: (level: string, message: string) => Log;
}
```

## 🎨 Styling

The plugin uses scoped CSS classes with the configurable prefix. Default classes:

```css
.gjs-version-flow-modal { /* Modal overlay */ }
.gjs-version-flow-modal-content { /* Modal content */ }
.gjs-version-flow-btn { /* Buttons */ }
.gjs-version-flow-btn-primary { /* Primary buttons */ }
.gjs-version-flow-logs { /* Log container */ }
.gjs-version-flow-log-entry { /* Individual log entries */ }
/* ... and more */
```

### Custom Styling

```javascript
{
  styles: {
    classPrefix: 'my-custom-prefix',
    injectCSS: `
      .custom-modal {
        background: linear-gradient(45deg, #007cba, #005a87);
      }
    `
  }
}
```

## 🌍 Internationalization

### Built-in Languages
- English (`en`) - Default
- French (`fr`)

### Custom Translations

```javascript
{
  i18n: {
    'es': {
      'grapesjs-version-flow': {
        'modal.title': 'Actualización de Versión Detectada',
        'modal.outdated.action': 'Actualizar Ahora',
        // ... more translations
      }
    }
  }
}
```

### Available Translation Keys

```
modal.title
modal.outdated.title
modal.outdated.message
modal.outdated.action
modal.upgrading.title
modal.upgrading.current
modal.upgrading.logs
modal.completed.title
modal.completed.message
modal.completed.logs
modal.completed.whatsNew
modal.completed.saveNow
modal.error.title
modal.error.message
modal.error.retry
modal.error.viewLogs
modal.firstRun.title
modal.firstRun.message
modal.firstRun.whatsNew
modal.close
modal.skip
log.level.info
log.level.warn
log.level.error
```

## 📡 Events

The plugin emits events throughout the upgrade lifecycle:

```javascript
// Version outdated detected
editor.on('version:outdated', ({ savedVersion, currentVersion }) => {
  console.log(`Upgrade needed from ${savedVersion} to ${currentVersion}`);
});

// Upgrade process started
editor.on('version:upgrade:start', ({ pending }) => {
  console.log('Starting upgrades for versions:', pending);
});

// Individual version upgrade started
editor.on('version:versionUpgrade:start', ({ toVersion }) => {
  console.log('Upgrading to:', toVersion);
});

// Individual version upgrade completed
editor.on('version:versionUpgrade:end', ({ toVersion, log }) => {
  console.log('Completed upgrade to:', toVersion, 'with logs:', log);
});

// All upgrades completed successfully
editor.on('version:upgrade:end', ({ upgradedTo }) => {
  console.log('All upgrades completed. Final version:', upgradedTo);
});

// Upgrade error occurred
editor.on('version:upgrade:error', ({ toVersion, error }) => {
  console.error('Upgrade failed for version:', toVersion, error);
});
```

## 🔧 Advanced Usage

### Custom Version Comparison

```javascript
{
  compareFn: (versionA, versionB) => {
    // Custom comparison logic
    // Return -1 if A < B, 0 if A === B, 1 if A > B
    const parseVersion = v => v.split('-')[0].split('.').map(Number);
    const a = parseVersion(versionA);
    const b = parseVersion(versionB);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const diff = (a[i] || 0) - (b[i] || 0);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    }
    return 0;
  }
}
```

### Complex Upgrade Example

```javascript
{
  builderVersion: '3.2.0',
  versions: [
    {
      builderVersion: '3.0.0',
      upgrade: async (ctx) => {
        const logs = [];

        try {
          // Step 1: Migrate components
          const components = ctx.getComponents();
          const migratedCount = components.length;

          components.forEach(comp => {
            const oldClass = comp.getAttributes().class;
            if (oldClass?.includes('legacy-')) {
              comp.addAttributes({
                class: oldClass.replace('legacy-', 'modern-')
              });
            }
          });

          logs.push({
            level: 'info',
            message: `Migrated ${migratedCount} components to new class structure`
          });

          // Step 2: Update project metadata
          const projectData = ctx.getProjectData();
          projectData.metadata = {
            ...projectData.metadata,
            migrationDate: new Date().toISOString(),
            previousVersion: '2.x.x'
          };
          ctx.setProjectData(projectData);

          logs.push({
            level: 'info',
            message: 'Updated project metadata'
          });

          // Step 3: Validate migration
          const hasLegacyClasses = components.some(comp =>
            comp.getAttributes().class?.includes('legacy-')
          );

          if (hasLegacyClasses) {
            logs.push({
              level: 'warn',
              message: 'Some legacy classes may still exist'
            });
          }

          return logs;

        } catch (error) {
          logs.push({
            level: 'error',
            message: `Migration failed: ${error.message}`
          });
          throw error;
        }
      },

      whatsNew: async (ctx) => {
        // Show rich what's new content
        const modal = ctx.editor.Modal.open({
          title: 'Welcome to Version 3.0!',
          content: `
            <div style="padding: 20px;">
              <h3>🎉 Major Updates</h3>
              <ul>
                <li>New modern component architecture</li>
                <li>Improved performance and stability</li>
                <li>Enhanced accessibility features</li>
              </ul>
              <h3>🔧 Breaking Changes</h3>
              <ul>
                <li>Legacy class names have been updated</li>
                <li>Old API methods are deprecated</li>
              </ul>
            </div>
          `
        });
      }
    }
  ]
}
```

### Error Handling & Recovery

```javascript
{
  continueOnError: true, // Continue with next versions even if one fails
  versions: [
    {
      builderVersion: '2.1.0',
      upgrade: (ctx) => {
        try {
          // Risky operation
          performComplexMigration();
          return [{ level: 'info', message: 'Migration successful' }];
        } catch (error) {
          // Log error but don't throw to allow continuation
          ctx.addLog('error', `Non-critical migration failed: ${error.message}`);
          return [{ level: 'warn', message: 'Partial migration completed' }];
        }
      }
    }
  ]
}
```

## 🧪 Example Project

See the `_index.html` file for a complete working example with:
- Multiple version steps
- Simulated failures and recovery
- Demo controls for testing different scenarios
- Event logging

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/silexlabs/grapesjs-version-flow.git
cd grapesjs-version-flow

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🏗️ Architecture

The plugin consists of several key components:

- **VersionManager**: Handles version persistence, comparison, and upgrade detection
- **UpgradeEngine**: Executes upgrade steps sequentially with error handling
- **ModalUI**: Manages the user interface and different modal states
- **EventSystem**: Provides lifecycle event emission and handling
- **StyleManager**: Handles CSS injection and scoping

## 🔒 Security Considerations

- Upgrade functions run in the same context as your application
- Always validate and sanitize data in upgrade functions
- Be cautious with `eval()` or similar dynamic code execution
- Test upgrade paths thoroughly before deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

AGPL-v3 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [GrapesJS CLI](https://github.com/GrapesJS/cli)
- Inspired by database migration patterns
- Thanks to the GrapesJS community for feedback and suggestions
