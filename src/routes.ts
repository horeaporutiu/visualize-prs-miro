import { Express, Request, Response } from 'express';

// Register all application routes
export function registerRoutes(app: Express): void {
  // Public endpoint - no auth required
  app.get('/api/public', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to the API' });
  });

  // Protected CRUD endpoints
  app.get('/api/items', (_req: Request, res: Response) => {
    res.json({ items: [] });
  });

  app.post('/api/items', (req: Request, res: Response) => {
    const { name, description } = req.body;
    res.status(201).json({ id: Date.now(), name, description });
  });

  app.get('/api/items/:id', (req: Request, res: Response) => {
    res.json({ id: req.params.id, name: 'Sample Item' });
  });

  app.delete('/api/items/:id', (req: Request, res: Response) => {
    res.status(204).send();
  });

  // User management endpoints
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json({ users: [] });
  });

  app.post('/api/users', (req: Request, res: Response) => {
    const { email, name, role } = req.body;
    res.status(201).json({ id: Date.now(), email, name, role });
  });

  app.get('/api/users/:id', (req: Request, res: Response) => {
    res.json({ id: req.params.id, email: 'user@example.com', name: 'Jane Doe', role: 'admin' });
  });
}
