import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FolderOpen, Save, Plus, Trash2, X } from 'lucide-react-native';
import { C, RADIUS, SPACE } from '../theme';
import { deleteProject, listProjects } from '../storage/projects';

/** Records saved before updatedAt existed rendered a literal "Invalid Date". */
const formatSaved = (value) => {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? '' : ` · ${date.toLocaleString()}`;
};

const Button = ({ children, onPress, accent = C.line }) => (
  <Pressable onPress={onPress} style={[styles.button, { borderColor: accent }]}>{children}</Pressable>
);

export default function ProjectBar({ projectName, onSave, onNew, onLoad }) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [name, setName] = useState(projectName || 'My Beat');
  const [projects, setProjects] = useState([]);

  useEffect(() => setName(projectName || 'My Beat'), [projectName]);

  const openLibrary = async () => {
    setProjects(await listProjects());
    setLibraryOpen(true);
  };

  const refresh = async () => setProjects(await listProjects());

  const save = async () => {
    const clean = name.trim() || 'My Beat';
    await onSave(clean);
    setSaveOpen(false);
  };

  const remove = async (id) => {
    await deleteProject(id);
    await refresh();
  };

  return <>
    <View style={styles.bar}>
      <View style={styles.titleWrap}>
        <Text style={styles.label}>PROJECT</Text>
        <Text numberOfLines={1} style={styles.title}>{projectName || 'Unsaved Beat'}</Text>
      </View>
      <View style={styles.actions}>
        <Button onPress={onNew}><Plus size={13} color={C.textDim} /><Text style={styles.text}>NEW</Text></Button>
        <Button onPress={() => setSaveOpen(true)} accent={C.cyan}><Save size={13} color={C.cyan} /><Text style={[styles.text, { color: C.cyan }]}>SAVE</Text></Button>
        <Button onPress={openLibrary} accent={C.violet}><FolderOpen size={13} color={C.violet} /><Text style={[styles.text, { color: C.violet }]}>LOAD</Text></Button>
      </View>
    </View>

    <Modal visible={saveOpen} transparent animationType="fade" onRequestClose={() => setSaveOpen(false)}>
      <View style={styles.overlay}><View style={styles.modal}>
        <View style={styles.modalHead}><Text style={styles.modalTitle}>SAVE PROJECT</Text><Pressable onPress={() => setSaveOpen(false)}><X size={18} color={C.textDim} /></Pressable></View>
        <TextInput value={name} onChangeText={setName} autoFocus placeholder="Project name" placeholderTextColor={C.textFaint} style={styles.input} maxLength={48} />
        <Button onPress={save} accent={C.cyan}><Save size={14} color={C.cyan} /><Text style={[styles.text, { color: C.cyan }]}>SAVE BEAT</Text></Button>
      </View></View>
    </Modal>

    <Modal visible={libraryOpen} transparent animationType="fade" onRequestClose={() => setLibraryOpen(false)}>
      <View style={styles.overlay}><View style={[styles.modal, styles.library]}>
        <View style={styles.modalHead}><Text style={styles.modalTitle}>MY BEATS</Text><Pressable onPress={() => setLibraryOpen(false)}><X size={18} color={C.textDim} /></Pressable></View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {projects.length === 0 ? <Text style={styles.empty}>No saved projects yet.</Text> : projects.map((project) => <View key={project.id} style={styles.projectRow}>
            <Pressable style={styles.projectInfo} onPress={() => { onLoad(project); setLibraryOpen(false); }}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.meta}>{Math.round(Number(project.bpm) || 120)} BPM{formatSaved(project.updatedAt)}</Text>
            </Pressable>
            <Pressable onPress={() => remove(project.id)} style={styles.delete}><Trash2 size={15} color={C.red} /></Pressable>
          </View>)}
        </ScrollView>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm, padding: SPACE.sm, borderWidth: 1, borderColor: C.line, borderRadius: RADIUS.md, backgroundColor: C.panel },
  titleWrap: { flex: 1, minWidth: 0 }, label: { color: C.textFaint, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 }, title: { color: C.text, fontSize: 11, fontWeight: '900', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 5 }, button: { minHeight: 36, paddingHorizontal: 8, borderWidth: 1, borderRadius: RADIUS.sm, backgroundColor: C.bgElev, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }, text: { color: C.textDim, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: SPACE.lg }, modal: { width: '100%', maxWidth: 460, backgroundColor: C.panel, borderWidth: 1, borderColor: C.lineHi, borderRadius: RADIUS.lg, padding: SPACE.lg, gap: SPACE.md }, library: { maxHeight: '75%' }, modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalTitle: { color: C.text, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 }, input: { height: 44, borderWidth: 1, borderColor: C.lineHi, borderRadius: RADIUS.sm, backgroundColor: C.bg, color: C.text, paddingHorizontal: 12, fontSize: 13 }, list: { minHeight: 80 }, listContent: { gap: 6 }, empty: { color: C.textFaint, textAlign: 'center', paddingVertical: 24, fontSize: 11 }, projectRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: RADIUS.sm, backgroundColor: C.bgElev }, projectInfo: { flex: 1, padding: 11 }, projectName: { color: C.text, fontSize: 11, fontWeight: '900' }, meta: { color: C.textFaint, fontSize: 8, marginTop: 4 }, delete: { padding: 12 },
});
