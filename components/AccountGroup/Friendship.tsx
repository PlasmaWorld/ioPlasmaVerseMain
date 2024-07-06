"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { resolveMethod, readContract, ThirdwebContract } from 'thirdweb';
import { ChattApp } from '@/const/contracts';
import { useTransactionHandlerChattApp } from '@/TransactionHandler/ChattApp';
import { Button } from '@mantine/core';
import { IconPlus, IconTrash, IconUsers } from '@tabler/icons-react';

interface GetMemberListProps {
  userAddress: string;
  groupId: string;
}

const JoinDelete = ({ userAddress, groupId }: GetMemberListProps) => {
  const activeAccount = useActiveAccount();
  const [signerAddress, setSignerAddress] = useState<string>("");
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (activeAccount?.address) {
      setSignerAddress(activeAccount.address);
    }
  }, [activeAccount]);

  const fetchFriendsExists = useCallback(async (signerAddress: string, contract: ThirdwebContract) => {
    if (!signerAddress || !userAddress) return;
    try {
      const exists = await readContract({
        contract,
        method: resolveMethod("checkAlreadyFriends"),
        params: [signerAddress, userAddress]
      }) as unknown as boolean;
      setIsFriend(exists);
    } catch (error) {
      console.error('Error checking user existence:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    if (signerAddress) {
      fetchFriendsExists(signerAddress, ChattApp);
    }
  }, [signerAddress, fetchFriendsExists]);

  const { handleTransaction: handleAddFriend, isPending: isAddingFriend } = useTransactionHandlerChattApp(
    "addFriend",
    [userAddress],
    () => alert("Friend added successfully"),
    (error) => console.error('Add friend error:', error)
  );

  const { handleTransaction: handleDeleteFriend, isPending: isDeletingFriend } = useTransactionHandlerChattApp(
    "deleteFriend",
    [userAddress],
    () => alert("Friend deleted successfully"),
    (error) => console.error('Delete friend error:', error)
  );

  const { handleTransaction: handleJoinGroup, isPending: isJoiningGroup } = useTransactionHandlerChattApp(
    "joinGroup",
    [groupId],
    () => alert("Group Joined successfully"),
    (error) => console.error('Group Joined error:', error)
  );

  const onClickAddFriend = async () => {
    await handleAddFriend();
  };

  const onClickDeleteFriend = async () => {
    await handleDeleteFriend();
  };

  const onClickJoinGroup = async () => {
    await handleJoinGroup();
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {groupId ? (
            <Button
              onClick={onClickJoinGroup}
              leftIcon={<IconUsers size={16} />}
              variant="outline"
              disabled={isJoiningGroup}
            >
              Join Group
            </Button>
          ) : (
            <Button
              onClick={isFriend ? onClickDeleteFriend : onClickAddFriend}
              leftIcon={isFriend ? <IconTrash size={16} /> : <IconPlus size={16} />}
              variant="outline"
              disabled={isAddingFriend || isDeletingFriend}
            >
              {isFriend ? "Delete Friend" : "Add Friend"}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default JoinDelete;
