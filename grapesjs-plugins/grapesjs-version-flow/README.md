# @silexlabs/grapesjs-version-flow

A GrapesJS plugin for managing version upgrades and migrations with sequential upgrade flow and modal UI

Detects when a project was saved with an older version of your app, upgrades it step-by-step, and shows the changes and what is new in a modal. When no step changes the project and there is nothing new, no modal opens and the new version is saved with the next save.

> This code is part of a bigger project: [Silex v3](https://www.silex.me)
> This has been vibe coded entirely by @lexoyo, check the `prompts/` folder

[Version Flow Demo](https://codepen.io/lexoyo/full/JoYMqZJ)

## 🚀 Features

- **Automatic Version Detection**: Detects when a project was saved with an older application version
- **Sequential Upgrades**: Guides users through upgrades step-by-step in the correct order
- **Modal UI**: One modal with what is new and the changes to the project, only when there is something to show
- **Error Handling**: A failed step is replayed at the next opening, with a link to report the problem
- **Texts**: English by default, given by the app to translate them
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
            // Return what changed, or nothing when the project did not need this step
            return 'Buttons now use the new style';
          }
        }
      ],
      onLeave: () => { window.location.href = '/' },
      reportUrl: 'https://github.com/me/my-app/issues/new',
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
| `continueOnError` | `boolean` | `true` | Whether to continue upgrades after errors |
| `styles.classPrefix` | `string` | `'gjs-version-flow'` | CSS class prefix for styling |
| `styles.injectCSS` | `string` | `null` | Custom CSS to inject |
| `texts` | `object \| (editor) => object` | English texts | Texts of the modal, see below |
| `getWhatsNew` | `({ savedVersion, currentVersion }) => string` | `null` | HTML of what is new, empty when there is nothing to show |
| `onLeave` | `function` | `null` | Called by "Leave without updating", the cross and Escape, nothing is saved |
| `reportUrl` | `string` | `''` | New issue URL for "Report the problem", the button is hidden without it |

### VersionStep Contract

```typescript
interface VersionStep {
  builderVersion: string;                           // Target version
  upgrade: (ctx: UpgradeContext) => Promise<string | void> | string | void;  // What changed, nothing when the project did not need it
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

## 🌍 Texts

The plugin has neutral English texts. Give your own, or a function of the editor to translate them with your i18n. Silex gives these:

```javascript
{
  texts: editor => ({
    title: 'Silex {version}',
    whatsNewTitle: 'What\'s new in Silex {version}',
    updateMessage: 'This website was made with an older version of Silex. Silex needs to update it:',
    update: 'Update and save my website',
    leave: 'Leave without updating',
    ok: 'OK',
    errorTitle: 'Update failed',
    errorMessage: 'Silex could not update this website. Nothing is saved yet. If you edit the website, Silex saves your changes as usual and tries the update again next time you open it. Please report the problem.',
    errorDetails: 'Technical details',
    report: 'Report the problem',
    continueAnyway: 'Continue anyway',
    reportTitle: 'Website update failed in Silex {version}',
  }),
}
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

          return logs.map(log => log.message).join(', ');

        } catch (error) {
          logs.push({
            level: 'error',
            message: `Migration failed: ${error.message}`
          });
          throw error;
        }
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
          return 'Migration successful';
        } catch (error) {
          // Log error but don't throw to allow continuation
          ctx.addLog('error', `Non-critical migration failed: ${error.message}`);
          return 'Partial migration completed';
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
