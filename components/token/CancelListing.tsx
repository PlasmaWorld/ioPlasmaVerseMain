import { MARKETPLACE } from "@/const/contracts";
import { Button } from "@mantine/core";
import { sendAndConfirmTransaction } from "thirdweb";
import { cancelListing } from "thirdweb/extensions/marketplace";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";

type Props = {
  account: Account;
  listingId: bigint;
  refetchAllListings: () => void;

};

export default function CancelListingButton({ account, listingId, refetchAllListings }: Props) {
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();

  

  return (
    <Button
                 onClick={async () => {
                   
                   const transaction = cancelListing({
                     contract: MARKETPLACE,
                     listingId
                   });
                   await sendAndConfirmTransaction({
                     transaction,
                     account,
                   });
                   await refetchAllListings();
                 }}
               >
                 Cancel
               </Button>
  );
}
