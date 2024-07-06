"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import { useActiveAccount } from 'thirdweb/react';
import ProfilePage from './ProfileImage';
import { ThirdwebContract, readContract, resolveMethod } from 'thirdweb';
import { ChattApp } from '@/const/contracts';

interface Group {
  groupId: string;
  ownerAddress: string;
  name: string;
}

interface Friend {
  address: string;
  name: string;
}

interface GetGroupListProps {
  userAddress: string;
  groupId: string;
  useCase: string;
  onFriendSelect?: (key: string) => void;
}

const GetMemberList: React.FC<GetGroupListProps> = ({ userAddress, useCase, onFriendSelect }) => {
  const activeAccount = useActiveAccount();
  const [signerAddress, setSignerAddress] = useState<string>("");
  const [displayUsers, setDisplayUsers] = useState<Friend[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (activeAccount?.address) {
      setSignerAddress(activeAccount.address);
    }
  }, [activeAccount]);

  const fetchAllGroups = useCallback(async (contract: ThirdwebContract) => {
    setIsLoading(true);
    try {
      const allGroupsData = await readContract({
        contract,
        method: resolveMethod("getAllGroups"),
        params: []
      }) as unknown as any[];
      console.log('Fetched all groups data:', allGroupsData);
      if (allGroupsData && Array.isArray(allGroupsData)) {
        const formattedGroups = (allGroupsData[0] as BigNumber[]).map((groupId, index) => ({
          groupId: groupId.toString(),
          ownerAddress: allGroupsData[1][index] as string,
          name: allGroupsData[2][index] as string
        }));
        console.log('Formatted groups:', formattedGroups);
        setAllGroups(formattedGroups);
      }
    } catch (error) {
      console.error('Error fetching all groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyGroups = useCallback(async (contract: ThirdwebContract, signerAddress: string) => {
    setIsLoading(true);
    try {
      const myGroupsData = await readContract({
        contract,
        method: resolveMethod("getMyGroups"),
        params: [signerAddress]
      }) as unknown as any[];
      console.log('Fetched my groups data:', myGroupsData);
      if (myGroupsData && Array.isArray(myGroupsData)) {
        const formattedGroups = (myGroupsData[0] as BigNumber[]).map((groupId, index) => ({
          groupId: groupId.toString(),
          ownerAddress: myGroupsData[1][index] as string,
          name: myGroupsData[2][index] as string
        }));
        console.log('Formatted my groups:', formattedGroups);
        setMyGroups(formattedGroups);
      }
    } catch (error) {
      console.error('Error fetching my groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyFriendList = useCallback(async (contract: ThirdwebContract, signerAddress: string) => {
    setIsLoading(true);
    try {
      const data = await readContract({
        contract,
        method: resolveMethod("getMyFriendList"),
        params: [signerAddress]
      }) as unknown as any[];
      console.log('Fetched my friend list data:', data);
      if (data && Array.isArray(data)) {
        const addresses = data[0] as string[];
        const names = data[1] as string[];
        console.log('Addresses:', addresses);
        console.log('Names:', names);
        if (Array.isArray(addresses) && Array.isArray(names)) {
          const formattedFriends = addresses.map((address, index) => ({
            address,
            name: names[index]
          }));
          console.log('Formatted friends:', formattedFriends);
          setFriends(formattedFriends);
        } else {
          console.error('Expected addresses and names to be arrays');
        }
      } else {
        console.error('Expected data to be an array');
      }
    } catch (error) {
      console.error('Error fetching my friend list:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllAppUsers = useCallback(async (contract: ThirdwebContract) => {
    setIsLoading(true);
    try {
      const usersData = await readContract({
        contract,
        method: resolveMethod("getAllAppUsers"),
        params: [],
      }) as unknown as any[];
      console.log('Fetched all app users data:', usersData);
      if (usersData && Array.isArray(usersData)) {
        const formattedUsers = usersData.map((user: any) => {
          let username = 'Unknown user', address = 'Invalid address', date = 'Invalid date';
          if (Array.isArray(user) && user.length >= 3 && BigNumber.isBigNumber(user[2])) {
            try {
              username = user[0] || username;
              address = user[1] || address;
              const timestampValue = BigNumber.from(user[2]);
              date = new Date(timestampValue.toNumber() * 1000).toLocaleString();
            } catch (error) {
              console.error("Failed to process user data:", user, "Error:", error);
            }
          }
          return { name: username, address, date };
        });
        console.log('Formatted all app users:', formattedUsers);
        setDisplayUsers(formattedUsers);
      } else {
        console.error('Expected usersData to be an array');
      }
    } catch (error) {
      console.error('Error fetching all app users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (useCase && signerAddress) {
      switch (useCase) {
        case "fetchAllGroups":
          fetchAllGroups(ChattApp);
          break;
        case "fetchMyGroups":
          fetchMyGroups(ChattApp, signerAddress);
          break;
        case "fetchMyFriendList":
          fetchMyFriendList(ChattApp, signerAddress);
          break;
        case "fetchAllAppUsers":
          fetchAllAppUsers(ChattApp);
          break;
        default:
          break;
      }
    }
  }, [useCase, signerAddress, fetchAllGroups, fetchMyGroups, fetchMyFriendList, fetchAllAppUsers]);

  const availableGroups = allGroups.filter(ag => !myGroups.some(mg => mg.groupId === ag.groupId));

  return (
    <div>
      <h1>Available Groups</h1>
      <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        {availableGroups.map((group) => (
          <div key={group.groupId} style={{ display: 'inline-block', margin: '10px' }}>
            <ProfilePage ownerAddresse={group.ownerAddress}  />
          </div>
        ))}
      </div>
      <h1>Friends</h1>
      <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        {friends.map((friend) => (
          <div key={friend.address} style={{ display: 'inline-block', margin: '10px' }}>
            <ProfilePage ownerAddresse={friend.address} />
          </div>
        ))}
      </div>
      <h1>All Users</h1>
      <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        {displayUsers.map((user) => (
          <div key={user.address} style={{ display: 'inline-block', margin: '10px' }}>
            <ProfilePage ownerAddresse={user.address}  />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GetMemberList;
