// CancelOfferButton.tsx
import { MARKETPLACE } from "@/const/contracts";
import { Button, Card, Text } from "@mantine/core";
import { sendAndConfirmTransaction } from "thirdweb";
import { Offer, cancelOffer } from "thirdweb/extensions/marketplace";
import type { Account } from "thirdweb/wallets";

type Props = {
  account: Account;
  offer: Offer;
  refetchAllOffers: () => void;


};

const CancelOfferButton = ({ account, offer, refetchAllOffers }: Props) => {
  const handleCancelOffer = async () => {
    try {
      const transaction = cancelOffer({
        contract: MARKETPLACE,
        offerId: offer.id,
      });
      await sendAndConfirmTransaction({
        transaction,
        account,
      });
      await refetchAllOffers();
    } catch (error) {
      console.error("Error canceling offer:", error);
    }
  };

  if (account.address !== offer.offerorAddress) {
    return null;
  }

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Text>Total Price: {offer.totalPrice.toString()}</Text>
      <Button onClick={handleCancelOffer}>
        Cancel Offer
      </Button>
    </Card>
  );
};

export default CancelOfferButton;
