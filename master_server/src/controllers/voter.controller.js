import { Voter } from "../models/Voter.js";
import { EC_Staff } from "../models/EC_Staff.js";
import { EC_Volunteer } from "../models/EC_Volunteer.js";
import { encryptData, decryptData } from "../utils/crypto.utils.js";
import { formatResponse } from "../utils/formatApiResponse.js";

export const handleVoterRegistration = async (req, res) => {
  const { voterId, name, biometric, verifiedByVolunteer } = req.body;

  if (!voterId || !name || !biometric || !verifiedByVolunteer) {
    return res
      .status(400)
      .json(formatResponse(false, null, 400, "Missing required fields."));
  }

  try {
    const encryptedRightThumb = encryptData(biometric.right);
    const encryptedLeftThumb = encryptData(biometric.left);

    // Check if voter already exists
    // const voterExist = await Voter.findOne({ where: { voterId } });

    // if (voterExist) {
    //   return res
    //     .status(409)
    //     .json(formatResponse(false, null, 409, "Voter already exists."));
    // }

    // Verify EC Volunteer biometric
    const volunteerProvided = await EC_Volunteer.findOne({
      where: {
        id: verifiedByVolunteer,
      },
    });

    if (!volunteerProvided)
      return res
        .status(404)
        .json(formatResponse(false, null, 404, "Volunteer not found"));

    // Register voter
    const voter = await Voter.create({
      voterId,
      name,
      biometric_right: encryptedRightThumb,
      biometric_left: encryptedLeftThumb,
      verifiedByVolunteer: verifiedByVolunteer,
    });

    return res
      .status(201)
      .json(
        formatResponse(
          true,
          { message: "Voter registered successfully", voter },
          null,
          null
        )
      );
  } catch (err) {
    console.error("Error during voter registration:", err);
    return res
      .status(500)
      .json(formatResponse(false, null, 500, "Internal Server Error"));
  }
};

export const getVoterById = async (req, res) => {
  const { id } = req.params; // Extract voter ID from request params

  try {
    // Check if voter exists
    const voter = await Voter.findOne({ where: { voterId: id } });

    if (!voter) {
      return res
        .status(200)
        .json(formatResponse(true, { message: "New User" }, null, null));
    }

    // If voter exists, return their details
    return res.status(200).json(
      formatResponse(
        true,
        {
          message: "Old User",
          voter: {
            id: voter.id,
            name: voter.name,
            biometric_left: voter.biometric_left,
            biometric_right: voter.biometric_right,
            imageUrl: voter.imageUrl,
            allowedPositions: voter.allowedPositions,
          },
        },
        null,
        null
      )
    );
  } catch (err) {
    console.error("Error fetching voter by ID:", err);
    return res
      .status(500)
      .json(
        formatResponse(false, null, 500, err.message || "Internal Server Error")
      );
  }
};

export const verifyVoter = async (req, res) => {
  const { id, verifiedByStaff } = req.body;

  try {
    const voter = await Voter.findOne({ where: { id } });

    const staffExist = await EC_Staff({ where: { id: verifiedByStaff } });

    if (!staffExist) {
      res.status(404).json(formatResponse(false, null, 404, "Staff Not Found"));
    }
    voter.verifiedByStaff = verifiedByStaff;

    await voter.save();

    return res
      .status(200)
      .json(
        formatResponse(
          true,
          { message: "Voter verified successfully", voter },
          null,
          null
        )
      );
  } catch (error) {
    console.error("Error verifying voter:", error);
    return res
      .status(500)
      .json(
        formatResponse(
          false,
          null,
          500,
          error.message || "Internal Server Error"
        )
      );
  }
};
