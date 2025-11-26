import { db } from '../lib/firebase';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';

export interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'module' | 'product';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  link: string;
}

export const globalSearch = async (searchTerm: string): Promise<SearchResult[]> => {
  if (!searchTerm || searchTerm.trim().length < 2) return [];

  const lowerSearchTerm = searchTerm.toLowerCase();
  const results: SearchResult[] = [];

  try {
    // Search Users
    const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(50)));
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      const userName = (user.name || '').toLowerCase();
      const userEmail = (user.email || '').toLowerCase();

      if (userName.includes(lowerSearchTerm) || userEmail.includes(lowerSearchTerm)) {
        results.push({
          id: doc.id,
          type: 'user',
          title: user.name || 'Unknown User',
          subtitle: user.email,
          imageUrl: user.photoURL,
          link: `/profile/${doc.id}`
        });
      }
    });

    // Search Courses
    const coursesSnapshot = await getDocs(query(collection(db, 'courses'), limit(50)));
    coursesSnapshot.docs.forEach(doc => {
      const course = doc.data();
      const courseTitle = (course.title || '').toLowerCase();
      const courseDesc = (course.description || '').toLowerCase();

      if (courseTitle.includes(lowerSearchTerm) || courseDesc.includes(lowerSearchTerm)) {
        results.push({
          id: doc.id,
          type: 'course',
          title: course.title || 'Untitled Course',
          subtitle: course.description,
          imageUrl: course.thumbnail_url,
          link: `/courses/${doc.id}`
        });
      }
    });

    // Search Main Modules
    const modulesSnapshot = await getDocs(query(collection(db, 'main_modules'), limit(50)));
    modulesSnapshot.docs.forEach(doc => {
      const module = doc.data();
      const moduleTitle = (module.title || '').toLowerCase();
      const moduleDesc = (module.description || '').toLowerCase();

      if (moduleTitle.includes(lowerSearchTerm) || moduleDesc.includes(lowerSearchTerm)) {
        results.push({
          id: doc.id,
          type: 'module',
          title: module.title || 'Untitled Module',
          subtitle: module.description,
          imageUrl: module.coverImage,
          link: `/main-modules/${doc.id}`
        });
      }
    });

    // Search Marketplace Products
    const productsSnapshot = await getDocs(query(collection(db, 'marketplace_products'), limit(50)));
    productsSnapshot.docs.forEach(doc => {
      const product = doc.data();
      const productTitle = (product.title || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();

      if (productTitle.includes(lowerSearchTerm) || productDesc.includes(lowerSearchTerm)) {
        results.push({
          id: doc.id,
          type: 'product',
          title: product.title || 'Untitled Product',
          subtitle: `${product.currency} ${product.price}`,
          imageUrl: product.images?.[0],
          link: `/marketplace/${doc.id}`
        });
      }
    });

    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase() === lowerSearchTerm;
      const bExactMatch = b.title.toLowerCase() === lowerSearchTerm;

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      return 0;
    });

    return results.slice(0, 20); // Return top 20 results
  } catch (error) {
    console.error('Error in global search:', error);
    return [];
  }
};
