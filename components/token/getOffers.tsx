// AcceptOfferButton.tsx
import { MARKETPLACE } from "@/const/contracts";
import { Button, Card, Text } from "@mantine/core";
import { sendAndConfirmTransaction } from "thirdweb";
import { Offer, acceptOffer } from "thirdweb/extensions/marketplace";
import type { Account } from "thirdweb/wallets";

type Props = {
  account: Account;
  offer: Offer;
  offerId?: bigint;
  refetchAllOffers: () => void;

};

const AcceptOfferButton = ({ account, offer, refetchAllOffers }: Props) => {
  const handleAcceptOffer = async () => {
    try {
      const transaction = acceptOffer({
        contract: MARKETPLACE,
        offerId: offer.id,
      });
      await sendAndConfirmTransaction({
        transaction,
        account,
      });
      await refetchAllOffers();
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Text>Total Price: {offer.totalPrice.toString()}</Text>
      <Button onClick={handleAcceptOffer}>
        Accept Offer
      </Button>
    </Card>
  );
};

export default AcceptOfferButton;
