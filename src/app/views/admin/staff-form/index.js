import React, { useEffect, useState } from "react";
import {
    Grid,
    Icon,
    List,
    ListItem,
    ListItemText,
    DialogTitle,
    Dialog,
    Button,
} from "@material-ui/core";
import { useParams } from "react-router-dom";
import CohortStudents from "./CohortStudents";
import CohortDetails from "./CohortDetails";
import { MatxLoading } from "matx";
import axios from "../../../../axios";
import { Alert } from '@material-ui/lab';
import Snackbar from '@material-ui/core/Snackbar';
import DowndownMenu from "../../../components/DropdownMenu"

const options = [
    { label: "Change cohort stage", value: "change_stage" },
    { label: "Cohort Detailed Report", value: "cohort_deport" },
];

const Cohort = () => {
    const { slug } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState({ alert: false, type: "", text: "" })
    const [stageDialog, setStageDialog] = useState(false) 
    const [cohort, setCohort] = useState({})
    useEffect(() => {
        getCohort();
    }, [])

    const getCohort = () => {
        setIsLoading(true);
        axios.get(`${process.env.REACT_APP_API_HOST}/v1/admissions/cohort/${slug}`)
            .then(({ data }) => {
                setIsLoading(false);
                setCohort(data);
                console.log(data)
            })
            .catch(error => console.log(error));
    }
    const updateCohort = (values) => {
        console.log(values)
        axios.put(`${process.env.REACT_APP_API_HOST}/v1/admissions/cohort/${cohort.id}`, { ...values, certificate: cohort.certificate.id })
            .then((data) => {
                console.log(data)
                if (data.status <= 200) {
                    setMsg({ alert: true, type: "success", text: "Cohort details updated successfully" });
                } else setMsg({ alert: true, type: "error", text: "Could not update cohort details" });
            })
            .catch(error => {
                console.log(error);
                setMsg({ alert: true, type: "error", text: error.details || "Unknown problem when updating the cohort" })
            })
    }

    return (
        <>
            <div className="m-sm-30">
                <div className="flex flex-wrap justify-between mb-6">
                    <div>
                        <h3 className="mt-0 mb-4 font-medium text-28">Cohort: {slug}</h3>
                        <div className="flex">
                            <div className="px-3 text-11 py-3px border-radius-4 text-white bg-green mr-3" onClick={()=> setStageDialog(true)} style={{ cursor: "pointer" }}>
                                {cohort && cohort.stage}
                            </div>
                        </div>
                    </div>
                    {isLoading && <MatxLoading />}
                    <DowndownMenu options={options} icon="more_horiz">
                        <Button>
                            <Icon>playlist_add</Icon>
                            Additional Actions
                        </Button>
                    </DowndownMenu>
                </div>
                <Grid container spacing={3}>
                    <Grid item md={4} xs={12}>
                        <CohortDetails
                            slug={slug}
                            lang={cohort.lang || "en"}
                            endDate={cohort.ending_date}
                            startDate={cohort.kickoff_date}
                            id={cohort.id}
                            onSubmit={updateCohort}
                        />
                    </Grid>
                    <Grid item md={8} xs={12}>
                        <CohortStudents
                            slug={slug}
                            id={cohort.id}
                        />
                    </Grid>
                </Grid>
                {msg.alert ? <Snackbar open={msg.alert} autoHideDuration={15000} onClose={() => setMsg({ alert: false, text: "", type: "" })}>
                    <Alert onClose={() => setMsg({ alert: false, text: "", type: "" })} severity={msg.type}>
                        {msg.text}
                    </Alert>
                </Snackbar> : ""}
            </div>
            <Dialog
                onClose={() => setStageDialog(false)}
                open={stageDialog}
                aria-labelledby="simple-dialog-title"
            >
                <DialogTitle id="simple-dialog-title">Select a Cohort Stage</DialogTitle>
                <List>
                    {['ACTIVE', 'INACTIVE', 'PREWORK', 'FINAL_PROJECT','ENDED' ].map((stage, i) => (
                        <ListItem
                            button
                            onClick={() => {
                                updateCohort({
                                    stage: stage, 
                                    slug:cohort.slug, 
                                    name:cohort.name, 
                                    language:cohort.language, 
                                    kickoff_date:cohort.kickoff_date,
                                    ending_date: cohort.ending_date
                                });
                                setStageDialog(false)
                            }}
                            key={i}
                        >
                            <ListItemText primary={stage} />
                        </ListItem>
                    ))}
                </List>
            </Dialog>
        </>
    );
};

export default Cohort;
