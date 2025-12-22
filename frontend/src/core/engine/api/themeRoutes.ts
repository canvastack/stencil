/**
 * Theme System Admin API Routes
 */
import express from 'express';
import multer from 'multer';
import { ThemeInstaller } from '../utils/ThemeInstaller';
import { ThemePackager } from '../utils/ThemePackager';
import { validateTheme } from '../utils/themeValidator';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const themeInstaller = ThemeInstaller.getInstance();

// Get all installed themes
router.get('/themes', (req, res) => {
  try {
    const themes = themeInstaller.getInstalledThemes();
    res.json({ themes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// Get active theme
router.get('/themes/active', (req, res) => {
  try {
    const theme = themeInstaller.getActiveTheme();
    res.json({ theme });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active theme' });
  }
});

// Install new theme
router.post('/themes/install', upload.single('theme'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No theme file provided' });
    }

    const themeBlob = new Blob([req.file.buffer]);
    const theme = await ThemePackager.extractThemePackage(themeBlob);

    // Validate theme
    const isValid = await validateTheme(theme);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid theme package' });
    }

    // Install theme
    await themeInstaller.installTheme(theme);
    res.json({ success: true, theme: theme.metadata });
  } catch (error) {
    res.status(500).json({ error: 'Failed to install theme' });
  }
});

// Uninstall theme
router.delete('/themes/:themeName', async (req, res) => {
  try {
    const { themeName } = req.params;
    await themeInstaller.uninstallTheme(themeName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to uninstall theme' });
  }
});

// Activate theme
router.post('/themes/:themeName/activate', async (req, res) => {
  try {
    const { themeName } = req.params;
    await themeInstaller.activateTheme(themeName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate theme' });
  }
});

// Export theme
router.get('/themes/:themeName/export', async (req, res) => {
  try {
    const { themeName } = req.params;
    const theme = themeInstaller.getTheme(themeName);
    
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const themePackage = await ThemePackager.createThemePackage(theme);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${themeName}.zip"`);
    res.send(Buffer.from(await themePackage.arrayBuffer()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to export theme' });
  }
});

export default router;