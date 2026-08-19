import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@beatforge/projects/v1';

export async function listProjects() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const projects = raw ? JSON.parse(raw) : [];
    return Array.isArray(projects) ? projects.sort((a, b) => b.updatedAt - a.updatedAt) : [];
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
