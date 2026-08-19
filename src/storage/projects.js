import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@beatforge/projects/v1';

export async function listProjects() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const projects = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(projects)) return [];
    // Drop malformed entries and treat a missing timestamp as 0, otherwise the
    // NaN comparisons leave the library in an arbitrary order.
    return projects
      .filter((p) => p && typeof p === 'object' && p.id)
      .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
  } catch {
    return [];
  }
}

export async function saveProject(project) {
  const projects = await listProjects();
  const next = { ...project, updatedAt: Date.now() };
  const index = projects.findIndex((p) => p.id === next.id);
  if (index >= 0) projects[index] = next;
  else projects.unshift(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(projects));
  return next;
}

export async function deleteProject(id) {
  const projects = (await listProjects()).filter((p) => p.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(projects));
}

export async function getProject(id) {
  return (await listProjects()).find((p) => p.id === id) || null;
}
