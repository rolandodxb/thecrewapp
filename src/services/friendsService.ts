import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  increment
} from 'firebase/firestore';

export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_avatar?: string;
  to_user_id: string;
  to_user_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: Timestamp;
}

export interface Follower {
  id: string;
  follower_id: string;
  follower_name: string;
  follower_avatar?: string;
  following_id: string;
  created_at: Timestamp;
}

// Send a friend request
export const sendFriendRequest = async (
  fromUserId: string,
  fromUserName: string,
  fromUserAvatar: string | undefined,
  toUserId: string,
  toUserName: string
): Promise<void> => {
  const requestId = `${fromUserId}_${toUserId}`;
  const requestRef = doc(db, 'friend_requests', requestId);

  const requestData: Omit<FriendRequest, 'id'> = {
    from_user_id: fromUserId,
    from_user_name: fromUserName,
    from_user_avatar: fromUserAvatar,
    to_user_id: toUserId,
    to_user_name: toUserName,
    status: 'pending',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now()
  };

  await setDoc(requestRef, requestData);
};

// Accept friend request
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(db, 'friend_requests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) throw new Error('Friend request not found');

  const request = requestSnap.data() as FriendRequest;

  // Update request status
  await updateDoc(requestRef, {
    status: 'accepted',
    updated_at: Timestamp.now()
  });

  // Create friendship (bidirectional)
  const friendshipId = `${request.from_user_id}_${request.to_user_id}`;
  const friendshipRef = doc(db, 'friendships', friendshipId);

  await setDoc(friendshipRef, {
    user1_id: request.from_user_id,
    user2_id: request.to_user_id,
    created_at: Timestamp.now()
  });
};

// Reject friend request
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(db, 'friend_requests', requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
    updated_at: Timestamp.now()
  });
};

// Get pending friend requests for a user
export const getPendingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const q = query(
    collection(db, 'friend_requests'),
    where('to_user_id', '==', userId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
};

// Get all friends for a user
export const getUserFriends = async (userId: string): Promise<string[]> => {
  const q1 = query(collection(db, 'friendships'), where('user1_id', '==', userId));
  const q2 = query(collection(db, 'friendships'), where('user2_id', '==', userId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const friends: string[] = [];
  snap1.docs.forEach(doc => friends.push(doc.data().user2_id));
  snap2.docs.forEach(doc => friends.push(doc.data().user1_id));

  return friends;
};

// Check if two users are friends
export const areFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  const friendshipId1 = `${userId1}_${userId2}`;
  const friendshipId2 = `${userId2}_${userId1}`;

  const [snap1, snap2] = await Promise.all([
    getDoc(doc(db, 'friendships', friendshipId1)),
    getDoc(doc(db, 'friendships', friendshipId2))
  ]);

  return snap1.exists() || snap2.exists();
};

// Unfriend a user
export const unfriend = async (userId1: string, userId2: string): Promise<void> => {
  const friendshipId1 = `${userId1}_${userId2}`;
  const friendshipId2 = `${userId2}_${userId1}`;

  await Promise.all([
    deleteDoc(doc(db, 'friendships', friendshipId1)).catch(() => {}),
    deleteDoc(doc(db, 'friendships', friendshipId2)).catch(() => {})
  ]);
};

// Follow a user
export const followUser = async (
  followerId: string,
  followerName: string,
  followerAvatar: string | undefined,
  followingId: string
): Promise<void> => {
  const followId = `${followerId}_${followingId}`;
  const followRef = doc(db, 'followers', followId);

  await setDoc(followRef, {
    follower_id: followerId,
    follower_name: followerName,
    follower_avatar: followerAvatar,
    following_id: followingId,
    created_at: Timestamp.now()
  });

  // Increment follower count for the followed user
  const userRef = doc(db, 'users', followingId);
  await updateDoc(userRef, {
    follower_count: increment(1)
  }).catch(() => {});
};

// Unfollow a user
export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  const followId = `${followerId}_${followingId}`;
  await deleteDoc(doc(db, 'followers', followId));

  // Decrement follower count
  const userRef = doc(db, 'users', followingId);
  await updateDoc(userRef, {
    follower_count: increment(-1)
  }).catch(() => {});
};

// Check if user is following another user
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const followId = `${followerId}_${followingId}`;
  const followSnap = await getDoc(doc(db, 'followers', followId));
  return followSnap.exists();
};

// Get followers of a user
export const getUserFollowers = async (userId: string): Promise<Follower[]> => {
  const q = query(collection(db, 'followers'), where('following_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follower));
};

// Get users that a user is following
export const getUserFollowing = async (userId: string): Promise<Follower[]> => {
  const q = query(collection(db, 'followers'), where('follower_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follower));
};

// Get follower/following counts
export const getFollowerCounts = async (userId: string): Promise<{ followers: number; following: number }> => {
  const [followersSnap, followingSnap] = await Promise.all([
    getDocs(query(collection(db, 'followers'), where('following_id', '==', userId))),
    getDocs(query(collection(db, 'followers'), where('follower_id', '==', userId)))
  ]);

  return {
    followers: followersSnap.size,
    following: followingSnap.size
  };
};
