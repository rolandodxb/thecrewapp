import { db } from '../lib/auth';
export interface MainModule {
  id: string;
  type: 'main';
  title: string;
  description: string;
  coverImage: string;
  visible: boolean;
  course_id?: string;
  course1_id?: string;
  course2_id?: string;
  submodules?: {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    course_id?: string;
    course1_id?: string;
    course2_id?: string;
    order: number;
  }[];
  created_at: string;
  updated_at: string;
}
export interface Submodule {
  id: string;
  type: 'submodule';
  parentModuleId: string;
  order: number;
  title: string;
  description: string;
  coverImage: string;
  course_id?: string;
  course1_id?: string;
  course2_id?: string;
  created_at: string;
  updated_at: string;
}
export const createMainModule = async (data: {
  title: string;
  description: string;
  coverImage: string;
  visible: boolean;
  course_id?: string;
  course1_id?: string;
  course2_id?: string;
  submodules?: {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    course_id?: string;
    course1_id?: string;
    course2_id?: string;
    order: number;
  }[];
}): Promise<string> => {
  try {
    console.log('createMainModule: Starting creation with data:', data);
    const moduleRef = doc(collection(db, 'main_modules'));
    const moduleId = moduleRef.id;
    console.log('createMainModule: Generated module ID:', moduleId);
    const mainModule: MainModule = {
      id: moduleId,
      type: 'main',
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      visible: data.visible,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (data.course_id) mainModule.course_id = data.course_id;
    if (data.course1_id) mainModule.course1_id = data.course1_id;
    if (data.course2_id) mainModule.course2_id = data.course2_id;
    if (data.submodules && data.submodules.length > 0) mainModule.submodules = data.submodules;
    console.log('createMainModule: Module object to save:', mainModule);
    console.log('createMainModule: Saving to collection path: main_modules');
    await setDoc(moduleRef, mainModule);
    console.log('createMainModule: Successfully saved main module with ID:', moduleId);
    console.log('createMainModule: Module should now be in Firestore at: main_modules/' + moduleId);
    return moduleId;
  } catch (error) {
    console.error('createMainModule: Error creating main module:', error);
    throw error;
  }
};
export const createSubmodule = async (data: {
  parentModuleId: string;
  order: number;
  title: string;
  description: string;
  coverImage: string;
  course_id?: string;
  course1_id?: string;
  course2_id?: string;
}): Promise<string> => {
  try {
    const submoduleRef = doc(collection(db, 'submodules'));
    const submoduleId = submoduleRef.id;
    const submodule: Submodule = {
      id: submoduleId,
      type: 'submodule',
      parentModuleId: data.parentModuleId,
      order: data.order,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (data.course_id) submodule.course_id = data.course_id;
    if (data.course1_id) submodule.course1_id = data.course1_id;
    if (data.course2_id) submodule.course2_id = data.course2_id;
    await setDoc(submoduleRef, submodule);
    console.log('Submodule created:', submoduleId);
    return submoduleId;
  } catch (error) {
    console.error('Error creating submodule:', error);
    throw error;
  }
};
export const getAllMainModules = async (): Promise<MainModule[]> => {
  try {
    console.log('getAllMainModules: Fetching from collection: main_modules');
    const modulesRef = collection(db, 'main_modules');
    const q = query(modulesRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    console.log('getAllMainModules: Found', snapshot.docs.length, 'main modules');
    const modules = snapshot.docs.map(doc => {
      const data = doc.data() as MainModule;
      console.log('getAllMainModules: Module:', doc.id, data);
      return data;
    });
    return modules;
  } catch (error) {
    console.error('getAllMainModules: Error fetching main modules:', error);
    return [];
  }
};
export const getMainModule = async (moduleId: string): Promise<MainModule | null> => {
  try {
    if (!moduleId || typeof moduleId !== 'string') {
      console.error('Invalid moduleId provided to getMainModule:', moduleId);
      return null;
    }
    const moduleRef = doc(db, 'main_modules', moduleId);
    const moduleSnap = await getDoc(moduleRef);
    if (moduleSnap.exists()) {
      return moduleSnap.data() as MainModule;
    }
    return null;
  } catch (error) {
    console.error('Error fetching main module:', error);
    return null;
  }
};
export const getSubmodulesByParent = async (parentModuleId: string): Promise<Submodule[]> => {
  try {
    const submodulesRef = collection(db, 'submodules');
    const snapshot = await getDocs(submodulesRef);
    const submodules = snapshot.docs
      .map(doc => doc.data() as Submodule)
      .filter(sub => sub.parentModuleId === parentModuleId)
      .sort((a, b) => a.order - b.order);
    return submodules;
  } catch (error) {
    console.error('Error fetching submodules:', error);
    return [];
  }
};
export const getSubmodule = async (submoduleId: string): Promise<Submodule | null> => {
  try {
    const modulesRef = collection(db, 'main_modules');
    const snapshot = await getDocs(modulesRef);
    for (const moduleDoc of snapshot.docs) {
      const moduleData = moduleDoc.data();
      const submodules = moduleData.submodules || [];
      const foundSubmodule = submodules.find((sub: any) => sub.id === submoduleId);
      if (foundSubmodule) {
        return {
          ...foundSubmodule,
          type: 'submodule',
          parentModuleId: moduleDoc.id,
          created_at: moduleData.created_at || '',
          updated_at: moduleData.updated_at || ''
        } as Submodule;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching submodule:', error);
    return null;
  }
};
export const updateMainModule = async (
  moduleId: string,
  data: Partial<Omit<MainModule, 'id' | 'type' | 'created_at'>>
): Promise<void> => {
  try {
    const moduleRef = doc(db, 'main_modules', moduleId);
    await updateDoc(moduleRef, {
      ...data,
      updated_at: new Date().toISOString()
    });
    console.log('Main module updated:', moduleId);
  } catch (error) {
    console.error('Error updating main module:', error);
    throw error;
  }
};
export const updateSubmodule = async (
  submoduleId: string,
  data: Partial<Omit<Submodule, 'id' | 'type' | 'created_at'>>
): Promise<void> => {
  try {
    const submoduleRef = doc(db, 'submodules', submoduleId);
    await updateDoc(submoduleRef, {
      ...data,
      updated_at: new Date().toISOString()
    });
    console.log('Submodule updated:', submoduleId);
  } catch (error) {
    console.error('Error updating submodule:', error);
    throw error;
  }
};
export const deleteMainModule = async (moduleId: string): Promise<void> => {
  try {
    const moduleRef = doc(db, 'main_modules', moduleId);
    await deleteDoc(moduleRef);
    console.log('Main module deleted:', moduleId);
  } catch (error) {
    console.error('Error deleting main module:', error);
    throw error;
  }
};
export const deleteSubmodule = async (submoduleId: string): Promise<void> => {
  try {
    const submoduleRef = doc(db, 'submodules', submoduleId);
    await deleteDoc(submoduleRef);
    console.log('Submodule deleted:', submoduleId);
  } catch (error) {
    console.error('Error deleting submodule:', error);
    throw error;
  }
};